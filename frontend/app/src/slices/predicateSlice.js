import {createEntityAdapter, createSlice, nanoid,} from '@reduxjs/toolkit'

/**
 * https://redux-toolkit.js.org/api/createEntityAdapter
 */
const predicateAdapter = createEntityAdapter({
    selectId: (predicate) => predicate.id,
    sortComparer: (a, b) => a.id.localeCompare(b.id),
});

const initialState = predicateAdapter.getInitialState({
    selectedPredicateId: undefined,
    prepredicateSelectedIds: undefined,
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
            predicateAdapter.addOne(state, transformClauseArrayToPredicate(nanoid(), 'manual', action.payload.clauses))
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
            state.selectedPredicateId = action.payload;
        },
        /**
         * Update the projection selection.
         */
        updatePrepredicateSelectedIds(state, action) {
            state.prepredicateSelectedIds = action.payload;
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

export const selectPrepredicateSelectedIds = (state) => {
    return state.predicate.prepredicateSelectedIds;
}

export const {addManualPredicate, removePredicate, updateSelectedPredicateId, updatePrepredicateSelectedIds, addPixalPredicates} = predicateSlice.actions;

export default predicateSlice.reducer;
