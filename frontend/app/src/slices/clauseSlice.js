import {createEntityAdapter, createSlice,} from '@reduxjs/toolkit'
import {addManualPredicate} from "./predicateSlice";

/**
 * https://redux-toolkit.js.org/api/createEntityAdapter
 */
const clauseAdapter = createEntityAdapter({
    selectId: (clause) => clause.column,
    sortComparer: (a, b) => a.column.localeCompare(b.column),
})

/**
 * This slice is for clauses before they evolve into a predicate.
 *
 * https://redux-toolkit.js.org/api/createSlice
 */
const clauseSlice = createSlice({
    name: 'clause',
    initialState: clauseAdapter.getInitialState(),
    reducers: {
        setClause: clauseAdapter.setOne,
        removeClause: clauseAdapter.removeOne,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addManualPredicate, (state, action) => {
                clauseAdapter.removeAll(state);
            })
    },
})
export const {
    selectAll: selectAllClauses,
    selectById: selectClauseById
} = clauseAdapter.getSelectors(state => state.clause);
export const {setClause, removeClause} = clauseSlice.actions;

export default clauseSlice.reducer;