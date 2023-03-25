import {useGetDataQuery} from "../services/pixal";
import {useSelector} from "react-redux";
import {selectProjectionBrushSelectedIds, selectSelectedPredicateOrDraft} from "../slices/predicateSlice";
import {useMemo} from "react";
import {isNil} from "../utils";


const useTransformedData = () => {
    // Can assume that it won't refetch during the lifetime of the app
    // const {data, isLoading, isSuccess} = useGetDataQuery(['redwine', 'tsne']);
    const {data, isLoading, isSuccess} = useGetDataQuery(['countries', 'tsne']);
    const selectedPredicate = useSelector(selectSelectedPredicateOrDraft);
    const projectionBrushSelectedIds = useSelector(selectProjectionBrushSelectedIds);

    /**
     * Adds an isFiltered boolean to each item based on the clauses in the selected predicate.
     */

    const transformedData = useMemo(() => {
        
        if (!isNil(data)) {
            if (isNil(selectedPredicate)) {
                return data;
            } else if ((selectedPredicate.id !== 'draft') && !isNil(projectionBrushSelectedIds)) {

                let clauseArray = Object.entries(selectedPredicate.clauses);
                let fromPredicateIds = data.filter(f => {
                    let testArray = [];
                    clauseArray.forEach(([col, range]) => {
                        if (f[col] >= range.min && f[col] <= range.max) testArray.push(f)
                    })
                    return testArray.length === clauseArray.length;
                }).map(m => m.id);

                let inPredicateButNotBrushArray = fromPredicateIds.filter(f => projectionBrushSelectedIds.indexOf(f) === -1);
                let inBrushButNotPredicateArray = projectionBrushSelectedIds.filter(f => fromPredicateIds.indexOf(f) === -1);
                let intersectionArray = projectionBrushSelectedIds.filter(f => fromPredicateIds.indexOf(f) !== -1);

                return data.map(d => {

                    let unselected = false;
                    let predNotBrush = false;
                    let brushNotPred = false;
                    let intersection = false;
                    //is the datum in the intersection of the two?
                    if (intersectionArray.indexOf(d.id) !== -1) {
                        intersection = true;
                        //is the datum in predicate but not brush selection
                    } else if (inPredicateButNotBrushArray.indexOf(d.id) !== -1) {
                        predNotBrush = true;
                        //is datum in the brush but not predicate
                    } else if (inBrushButNotPredicateArray.indexOf(d.id) !== -1) {
                        brushNotPred = true;
                        //is datum not involved in any of these selections
                    } else if (fromPredicateIds.indexOf(d.id) === -1 && projectionBrushSelectedIds.indexOf(d.id) === -1) {
                        unselected = true;
                    }

                    return ({
                        ...d,
                        intersection: intersection,
                        predNotBrush: predNotBrush,
                        brushNotPred: brushNotPred,
                        unselected: unselected
                    })
                });
            }

            return data.map(d => {
                let isFiltered = false;
                Object.entries(selectedPredicate.clauses).forEach(([col, range]) => {
                    isFiltered = d[col] < range.min || d[col] > range.max ? true : isFiltered;
                })

                return ({...d, isFiltered: !isFiltered})
            })
        }
        return undefined
    }, [data, selectedPredicate, projectionBrushSelectedIds]);

    return {data: transformedData, isLoading, isSuccess};
}

export default useTransformedData
