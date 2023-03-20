import {createEntityAdapter, createSlice, nanoid,} from '@reduxjs/toolkit'
import {isNil} from "../utils";

/**
 * https://redux-toolkit.js.org/api/createEntityAdapter
 */
const predicateAdapter = createEntityAdapter({
    selectId: (predicate) => predicate.id,
    sortComparer: (a, b) => a.id.localeCompare(b.id),
});

const initialState = predicateAdapter.getInitialState({
    selectedPredicateId: undefined,
    projectionBrushSelectedIds: undefined,
    comparisonIds:undefined,
    draftClauses: []
});

export const transformClauseArrayToPredicate = (id, type, clausesArr) => {
    const clausesDict = Object.fromEntries(clausesArr.map(d => [d.column, {'min': d.min, 'max': d.max}]));
    return {id: id, type: type, clauses: clausesDict}
}


/**
 * This slice is for predicates.
 *
 * https://redux-toolkit.js.org/api/createSlice
 */
const predicateSlice = createSlice({
    name: 'predicate',
    initialState: initialState,
    reducers: {
        /**
         * Add a predicate created manually by the user.
         */
        addManualPredicate: (state, action) => {
            predicateAdapter.addOne(state, transformClauseArrayToPredicate(nanoid(), 'manual', state.draftClauses));
            state.draftClauses = [];
        },
        /**
         * Add a predicate created manually by the user.
         */
        addPixalPredicates: (state, action) => {
            predicateAdapter.addMany(state, action.payload)
        },
        /**
         * Remove any predicate by ID.
         */
        removePredicate: predicateAdapter.removeOne,
        /**
         * Update which predicate is selected.
         */
        updateSelectedPredicateId(state, action) {
            if (!isNil(action.payload)) {
                state.draftClauses = [];
            } else {
                if (!isNil(state.selectedPredicateId)) {
                    state.draftClauses = Object.entries(state.entities[state.selectedPredicateId].clauses).map(([column, range]) => {
                        return {column: column, min: range.min, max: range.max}
                    })
                }
            }
            state.selectedPredicateId = action.payload;
        },
        /**
         * Update the projection selection.
         */
        updateProjectionBrushSelectedIds(state, action) {
            state.projectionBrushSelectedIds = action.payload;
        },
        /**
         * 
         * Update comparison ids
         */
        updateComparisonIds(state, action) {
            state.comparisonIds = action.payload;
        },
        
        setDraftClause(state, action) {
            let update = state.draftClauses;
            if (!isNil(state.selectedPredicateId)) {
                update = Object.entries(state.entities[state.selectedPredicateId].clauses).map(([column, range]) => {
                    return {column: column, min: range.min, max: range.max}
                })
                state.selectedPredicateId = undefined;
            }
            update = update.filter(d => d.column !== action.payload.column);
            update.push({column: action.payload.column, min: action.payload.min, max: action.payload.max})
            state.draftClauses = update;
        },
        removeDraftClause(state, action) {
            let update = state.draftClauses;
            if (!isNil(state.selectedPredicateId)) {
                update = Object.entries(state.entities[state.selectedPredicateId].clauses).map(([column, range]) => {
                    return {column: column, min: range.min, max: range.max}
                })
                state.selectedPredicateId = undefined;
            }
            state.draftClauses = update.filter(d => d.column !== action.payload);
        }

    },
});

export const {
    selectAll: selectAllPredicates,
    selectById: selectPredicateById
} = predicateAdapter.getSelectors(state => state.predicate);

/**
 * Gets the selected predicate's ID.
 * @param state
 * @returns The selected predicate's ID.
 */
export const selectSelectedPredicateId = (state) => {
    return state.predicate.selectedPredicateId;
}

export const selectProjectionBrushSelectedIds = (state) => {
    return state.predicate.projectionBrushSelectedIds;
}

export const selectAllDraftClauses = (state) => {
    return state.predicate.draftClauses;
}

export const selectAllComparisonIds = (state) => {
    return state.comparisonIds;
}

/**
 * Gets the selected predicate (if it exists). Otherwise, returns the draft predicate
 * (clauses from clause slice).
 * @param state
 * @returns A predicate.
 */
export const selectSelectedPredicateOrDraft = (state) => {
    const id = selectSelectedPredicateId(state);
    if (isNil(id)) {
        return transformClauseArrayToPredicate('draft', 'manual', selectAllDraftClauses(state))
    }
    return selectPredicateById(state, id);
}

export const {
    addManualPredicate,
    removePredicate,
    updateSelectedPredicateId,
    updateProjectionBrushSelectedIds,
    updateComparisonIds,
    addPixalPredicates,
    setDraftClause,
    removeDraftClause
} = predicateSlice.actions;

export default predicateSlice.reducer;
