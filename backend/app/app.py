import uuid

from os import environ
from pathlib import Path

from flask import Flask, request
import pandas as pd
from sklearn.manifold import TSNE

from predicates import infer_dtypes, encode, data_to_predicates, unique, bin_numeric, F1, PredicateInduction, parse_value_string, Predicate

DATA_FOLDER: Path = Path(Path(__file__).parent, 'data')

api = Flask(__name__)
api.config['SECRET_KEY'] = environ.get('SECRET_KEY')
projection_algorithms = {'tsne': TSNE(n_components=2).fit_transform}
datasets = {'redwine': 'winequality-red-w-tsne.csv'}


@api.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', '*')

    return response


@api.route('/api/data')
def data(dataset=None, projection_algorithm=None):
    """
    Load data given a path to a csv, infer dtypes, and transform the data given a projection algorithm. Returns projection data.
    :param dataset: The name of the dataset.
    :type dataset: str
    :param projection_algorithm: Name of the projection algorithm to be used as it appears in projection_algorithms.
    :type projection_algorithm: str
    :return: Projection data.
    :rtype: dict
    """

    dataset = request.args.get('dataset')

    features = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset]))) #dataframe containing original data
    features = features.to_dict(orient='records')

    for i in range(len(features)):
        f = features[i]
        f['id'] = i

    return features


@api.route('/api/predicates')
def predicate(dataset=None, projection_algorithm=None, selected_ids=None, comparison_ids=None):
    dataset = request.args.get('dataset')
    projection_algorithm = request.args.get('projection_algorithm')
    selected_ids = [int(x) for x in request.args.get('selected_ids').split(',')]
    comparison_ids = [int(x) for x in request.args.get('comparison_ids').split(',')] if request.args.get('comparison_ids') is not None else None

    df = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset]))).drop(columns=['x', 'y']) #dataframe containing original data

    dtypes = infer_dtypes(df)

    binned_df = bin_numeric(df, dtypes, )
    target = df.index.isin(selected_ids).astype(int)
    attribute_predicates, indices = data_to_predicates(binned_df, df, dtypes)
    f1 = F1()
    p = PredicateInduction(
        df, dtypes,
        target=target,
        score_func=f1,
        attribute_predicates=attribute_predicates,
    )

    a = {k: list(v.unique()) for k,v in indices[target==1].to_dict('series').items()}
    predicates = [x for y in [unique([attribute_predicates[k][i] for i in indices[k]]) for k,v in a.items()] for x in y]
    p.search(predicates if not p.started_search else None, max_accepted=1, max_steps=None, max_clauses=3, breadth_first=False)
    predicate = p.last_accepted

    clauses = {k: {'min': v[0], 'max': v[1]} for k,v in predicate.attribute_values.items()}
    return [{'id': uuid.uuid4(), 'type': 'pixal', 'clauses': clauses, 'score': p.score(predicate)}]
    # return [{'id': uuid.uuid4(), 'clauses': [{'column': 'pH', 'min': 3.37, 'max': 3.38}]}]

@api.route('/api/score_predicate')
def score_predicate():
    dataset = request.args.get('dataset')
    selected_ids = [int(x) for x in request.args.get('selected_ids').split(',')]

    data = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset])))
    dtypes = infer_dtypes(data)
    attribute_values = {k:v for k,v in request.args.to_dict().items() if k in dtypes}
    predicate = Predicate(data, dtypes, **{k: parse_value_string(v, dtypes[k]) for k,v in attribute_values.items()})
    target = data.index.isin(selected_ids)

    f1 = F1()
    p = PredicateInduction(
        data, dtypes,
        target=target,
        score_func=f1,
    )
    score = p.score(predicate)
    return {'score': score}

@api.route('/api/score_predicates', methods=['POST'])
def score_predicates():
    dataset = request.args.get('dataset')
    selected_ids = [int(x) for x in request.args.get('selected_ids').split(',')]
    comparison_ids = [int(x) for x in request.args.get('comparison_ids').split(',')] if request.args.get('comparison_ids') is not None else None
    predicate_dicts = request.get_json()

    data = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset])))
    dtypes = infer_dtypes(data)

    for i, pred in enumerate(predicate_dicts):
        transformed_clauses = {}
        for c, r in pred['clauses'].items():
            if c in dtypes:
                transformed_clauses[c] = [r['min'], r['max']]
        pred['clauses'] = transformed_clauses

    predicates = [Predicate(data, dtypes, **predicate_dict['clauses']) for predicate_dict in predicate_dicts]
    target = data.index.isin(selected_ids)
    
    f1 = F1()
    p = PredicateInduction(
        data, dtypes,
        target=target,
        score_func=f1,
    )

    scores = [p.score(pred) for pred in predicates]
    clauses = [pred['id'] for pred in predicate_dicts]
    res = [{'id': clauses[i], 'score': scores[i]} for i in range(len(predicates))]
    return res

if __name__ == "__main__":
    api.run(host='localhost',port=5000)


# @api.route('/api/predicate')
# def predicate(selected_ids=None, reference_ids=None):
#     """
#     Find the next best predicate given a set of selected ids and reference ids. The state of the predicate induction algorithm is stored as session data and will
#     resume the next time predicate is called.
#
#     :param selected_ids: List of ids for selected data points.
#     :type selected_ids: list
#     :param reference_ids: List of ids for reference data points.
#     :type reference_ids: list
#     :return: The id, name, and bayes factor for the next best predicate. Projection data with the selection and predicate as additional binary columns.
#              Data for the predicate error heatmap.
#     :rtype: dict
#     """
#
#     kwargs = request.get_json(force=True)
#     selected_ids = kwargs.get('selected_ids', [] if selected_ids is None else selected_ids)
#     reference_ids = kwargs.get('reference_ids', [i for i in range(session['data']['data'].shape[0]) if i not in selected_ids] if reference_ids is None else reference_ids)
#     ids = list(set(selected_ids + reference_ids))
#     df = session['data']['data'][session['data']['data'].index.isin(ids)] # only use only selected and reference data
#
#     # setup predicate induction algorithm
#     attribute_predicates=session['predicates'].get('attribute_predicates', data_to_predicates(df.loc[reference_ids], session['data']['dtypes'], df))
#     pi = PredicateInduction(
#         target=pd.Series(selected_ids),
#         score_func=Anomaly(dtype='binary'),
#         attribute_predicates=attribute_predicates,
#         frontier=session['predicates'].get('frontier'),
#         accepted=session['predicates'].get('accepted'),
#         rejected=session['predicates'].get('rejected')
#     )
#     predicate = pi.search(n=1) # run predicate induction algorithm until one new predicate is accepted
#
#     # save state of predicate induction algorithm as session data
#     session['predicates']['attribute_predicates'] = pi.attribute_predicates
#     session['predicates']['frontier'] = pi.frontier
#     session['predicates']['accepted'] = pi.accepted
#     session['predicates']['rejected'] = pi.rejected
#
#     projection = session['data']['projection'].assign(
#         selected=session['data']['projection'].index.isin(selected_ids),
#         predicate=predicate.mask.astype(int)
#     ) # add selected and predicate binary columns to projection data
#
#     # build false positive/negative rate heatmap
#     num_heatmap_bins = kwargs.get('num_heatmap_bins', 10)
#     heatmap_counts = projection.groupby(
#         [pd.cut(projection.x, bins=num_heatmap_bins), pd.cut(projection.y, bins=num_heatmap_bins)]
#     )[['tp', 'tn', 'fp', 'fn']].sum()
#     heatmap = pd.concat(
#         [heatmap_counts['fp']/(heatmap_counts['fp']+heatmap_counts['tn']), heatmap_counts['fn']/(heatmap_counts['fn']+heatmap_counts['tp'])],
#     axis=1).reset_index()
#
#     response_body = {
#         "id": predicate.id,
#         "name": predicate.name,
#         "bayes_factor" : pi.score(predicate),
#         'data': projection.to_dict('records'),
#         'heatmap': heatmap.to_dict('records'),
#     }
#     return response_body
#
# @api.route('/api/explanations')
# def explanations(predicate_id=None, num_bins=10):
#     """
#     Returns data needed to plot all explanations for a given predicate.
#
#     :param predicate_id: ID of the predicate want explanations for.
#     :type selected_ids: int
#     :param num_bins: Number of bins to use for histogram explanations.
#     :type reference_ids: int
#     :return: A list of explanations. Each explanation is a dictionary containing the local neighborhood data and which attributes to use for x/y-axes.
#     :rtype: dict
#     """
#
#     kwargs = request.get_json(force=True)
#     predicate = session['predicates']['accepted'][kwargs.get('predicate_id', predicate_id)]
#     attributes_1d = predicate.predicate_attributes
#     attributed_2d = combinations(attributes_1d, 2)
#
#     data = session['data']['data']
#     num_bins = kwargs.get('num_bins', num_bins)
#     explanations = []
#
#     # get 1D explanations
#     for attribute in attributes_1d:
#         dtype = session['data']['dtypes'][attribute]
#         grouper = [pd.cut(data[attribute], bins=num_bins), predicate.mask.astype(int)] if dtype == 'numeric' else [data[attribute], predicate.mask.astype(int)]
#         other_attributes = [attr for attr in predicate.attributes if attr != attribute]
#         d = data.loc[predicate.attribute_mask[other_attributes].all(axis=1)].groupby(grouper).count().reset_index()
#         d.columns = [attribute, 'predicate', 'count']
#         d['group_count'] = d.predicate.map(d.groupby('predicate')['count'].sum())
#
#         explanation = {'data': d.to_dict('records')}
#         explanation['x'] = attribute
#         explanation['y'] = 'count'
#         explanations.append(explanation)
#
#     # get 2D explanations
#     for attribute_x, attribute_y in attributed_2d:
#         dtype = session['data']['dtypes'][attribute]
#         other_attributes = [attr for attr in predicate.attributes if attr not in (attribute_x, attribute_y)]
#         d = data.assign(predicate=predicate.mask.astype(int)).loc[predicate.attribute_mask[other_attributes].all(axis=1)][[attribute_x, attribute_y, 'predicate']]
#
#         explanation = {'data': d.to_dict('records')}
#         explanation['x'] = attribute_x
#         explanation['y'] = attribute_y
#         explanations.append(explanation)
#
#         response_body = {
#             "explanations": explanations
#         }
#         return response_body
