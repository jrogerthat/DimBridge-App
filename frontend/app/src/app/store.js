import {configureStore} from '@reduxjs/toolkit';
import {pixalApi} from "../services/pixal";
import clauseReducer from '../slices/clauseSlice';
import predicateReducer from '../slices/predicateSlice';

/**
 * https://redux-toolkit.js.org/api/configureStore
 */
export const store = configureStore({
    reducer: {
        [pixalApi.reducerPath]: pixalApi.reducer,
        clause: clauseReducer,
        predicate: predicateReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(pixalApi.middleware),
});
