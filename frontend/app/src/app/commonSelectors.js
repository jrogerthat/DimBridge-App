import {
    selectPredicateById,
    selectSelectedPredicateId,
    transformClauseArrayToPredicate
} from "../slices/predicateSlice";
import {selectAllClauses} from "../slices/clauseSlice";
import {isNil} from "../utils";

/**
 * Gets the selected predicate (if it exists). Otherwise, returns the draft predicate
 * (clauses from clause slice).
 * @param state
 * @returns A predicate.
 */
export const selectSelectedPredicateOrDraft = (state) => {
    const id = selectSelectedPredicateId(state);
    if (isNil(id)) {
        const clauseArr = selectAllClauses(state);
        return transformClauseArrayToPredicate('draft', 'manual', clauseArr)
    }
    return selectPredicateById(state, id);
}
