from flask import Flask, request, session
import pandas as pd
from itertools import combinations
from sklearn.manifold import TSNE

from predicate_induction import PredicateInduction, Anomaly, infer_dtypes, encode_data, get_predicates_from_data

api = Flask(__name__)
projection_algorithms = {'tsne': TSNE(n_components=2).fit_transform}

@api.route('/data')
def data(path=None, projection_algorithm=None):
    """
    Load data given a path to a csv, infer dtypes, and transform the data given a projection algorithm. Returns projection data.

    :param path: Path to the csv to be loaded as data.
    :type path: str
    :param projection_algorithm: Name of the projection algorithm to be used as it appears in projection_algorithms.
    :type projection_algorithm: str
    :return: Projection data.
    :rtype: dict
    """

    kwargs = request.get_json(force=True)
    path = kwargs.get('path', path)
    projection_algorithm = kwargs.get('projection_algorithm', projection_algorithm)

    data = pd.read_csv(kwargs['path']) #dataframe containing original data
    dtypes = infer_dtypes(data)
    encoded_data = encode_data(data, dtypes) #one-hot encode numeric columns, date columns to numeric

    projection = projection_algorithms[kwargs['projection_algorithm']](encoded_data) #dataframe containing projection data
    session['data']['data'] = data
    session['data']['dtypes'] = dtypes
    session['data']['projection'] = projection

    response_body = {
        "projection": projection.to_dict('records')
    }
    return response_body

@api.route('/predicate')
def predicate(selected_ids=None, reference_ids=None):
    """
    Find the next best predicate given a set of selected ids and reference ids. The state of the predicate induction algorithm is stored as session data and will
    resume the next time predicate is called.

    :param selected_ids: List of ids for selected data points.
    :type selected_ids: list
    :param reference_ids: List of ids for reference data points.
    :type reference_ids: list
    :return: The id, name, and bayes factor for the next best predicate. Projection data with the selection and predicate as additional binary columns. 
             Data for the predicate error heatmap.
    :rtype: dict
    """

    kwargs = request.get_json(force=True)
    selected_ids = kwargs.get('selected_ids', [] if selected_ids is None else selected_ids)
    reference_ids = kwargs.get('reference_ids', [i for i in range(session['data']['data'].shape[0]) if i not in selected_ids] if reference_ids is None else reference_ids)
    ids = list(set(selected_ids + reference_ids))
    df = session['data']['data'][session['data']['data'].index.isin(ids)] # only use only selected and reference data

    # setup predicate induction algorithm
    attribute_predicates=session['predicates'].get('attribute_predicates', get_predicates_from_data(df.loc[reference_ids], session['data']['dtypes'], df))
    pi = PredicateInduction(
        target=selected_ids,
        score_func=Anomaly(dtype='binary'),
        attribute_predicates=attribute_predicates,
        frontier=session['predicates'].get('frontier'),
        accepted=session['predicates'].get('accepted'),
        rejected=session['predicates'].get('rejected')
    )
    predicate = pi.search(n=1) # run predicate induction algorithm until one new predicate is accepted

    # save state of predicate induction algorithm as session data
    session['predicates']['attribute_predicates'] = pi.attribute_predicates
    session['predicates']['frontier'] = pi.frontier
    session['predicates']['accepted'] = pi.accepted
    session['predicates']['rejected'] = pi.rejected

    projection = session['data']['projection'].assign(
        selected=session['data']['projection'].index.isin(selected_ids),
        predicate=predicate.mask.astype(int)
    ) # add selected and predicate binary columns to projection data

    # build false positive/negative rate heatmap
    num_heatmap_bins = kwargs.get('num_heatmap_bins', 10)
    heatmap_counts = projection.groupby(
        [pd.cut(projection.x, bins=num_heatmap_bins), pd.cut(projection.y, bins=num_heatmap_bins)]
    )[['tp', 'tn', 'fp', 'fn']].sum()
    heatmap = pd.concat(
        [heatmap_counts['fp']/(heatmap_counts['fp']+heatmap_counts['tn']), heatmap_counts['fn']/(heatmap_counts['fn']+heatmap_counts['tp'])],
    axis=1).reset_index()

    response_body = {
        "id": predicate.id,
        "name": predicate.name,
        "bayes_factor" : pi.score(predicate),
        'data': projection.to_dict('records'),
        'heatmap': heatmap.to_dict('records'),
    }
    return response_body

@api.route('/explanations')
def explanations(predicate_id=None, num_bins=10):
    """
    Returns data needed to plot all explanations for a given predicate.

    :param predicate_id: ID of the predicate want explanations for.
    :type selected_ids: int
    :param num_bins: Number of bins to use for histogram explanations.
    :type reference_ids: int
    :return: A list of explanations. Each explanation is a dictionary containing the local neighborhood data and which attributes to use for x/y-axes.
    :rtype: dict
    """

    kwargs = request.get_json(force=True)
    predicate = session['predicates']['accepted'][kwargs.get('predicate_id', predicate_id)]
    attributes_1d = predicate.predicate_attributes
    attributed_2d = combinations(attributes_1d, 2)
    
    data = session['data']['data']
    num_bins = kwargs.get('num_bins', num_bins)
    explanations = []

    # get 1D explanations
    for attribute in attributes_1d:
        dtype = session['data']['dtypes'][attribute]
        grouper = [pd.cut(data[attribute], bins=num_bins), predicate.mask.astype(int)] if dtype == 'numeric' else [data[attribute], predicate.mask.astype(int)]
        other_attributes = [attr for attr in predicate.attributes if attr != attribute]
        d = data.loc[predicate.attribute_mask[other_attributes].all(axis=1)].groupby(grouper).count().reset_index()
        d.columns = [attribute, 'predicate', 'count']
        d['group_count'] = d.predicate.map(d.groupby('predicate')['count'].sum())
        
        explanation = {'data': d.to_dict('records')}
        explanation['x'] = attribute
        explanation['y'] = 'count'
        explanations.append(explanation)

    # get 2D explanations
    for attribute_x, attribute_y in attributed_2d:
        dtype = session['data']['dtypes'][attribute]
        other_attributes = [attr for attr in predicate.attributes if attr not in (attribute_x, attribute_y)]
        d = data.assign(predicate=predicate.mask.astype(int)).loc[predicate.attribute_mask[other_attributes].all(axis=1)][[attribute_x, attribute_y, 'predicate']]
        
        explanation = {'data': d.to_dict('records')}
        explanation['x'] = attribute_x
        explanation['y'] = attribute_y
        explanations.append(explanation)

        response_body = {
            "explanations": explanations
        }
        return response_body