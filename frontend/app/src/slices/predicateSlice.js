import {createEntityAdapter, createSlice, nanoid,} from '@reduxjs/toolkit'

/**
 * https://redux-toolkit.js.org/api/createEntityAdapter
 */
const predicateAdapter = createEntityAdapter({
    selectId: (predicate) => predicate.id,
    sortComparer: (a, b) => a.id.localeCompare(b.id),
})

/**
 * This slice is for predicates.
 *
 * https://redux-toolkit.js.org/api/createSlice
 */
const predicateSlice = createSlice({
    name: 'predicate',
    initialState: predicateAdapter.getInitialState(),
    reducers: {
        addManualPredicate: (state, action) => {
            action.payload.id = nanoid()
            predicateAdapter.addOne(state, action)
        },
        removePredicate: predicateAdapter.removeOne,
    },
})
export const {selectAll: selectAllPredicates} = predicateAdapter.getSelectors(state => state.predicate);
export const {addManualPredicate, removePredicate} = predicateSlice.actions;

export default predicateSlice.reducer;