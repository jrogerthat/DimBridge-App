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
         * Remove any predicate by ID.
         */
        removePredicate: predicateAdapter.removeOne,
        /**
         * Update which predicate is selected.
         */
        updateSelectedPredicateId(state, action) {
            state.selectedPredicateId = action.payload;
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

export const {addManualPredicate, removePredicate, updateSelectedPredicateId} = predicateSlice.actions;

export default predicateSlice.reducer;
