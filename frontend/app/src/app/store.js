import {configureStore} from '@reduxjs/toolkit';
import {pixalApi} from "../services/pixal";
import predicateReducer from '../slices/predicateSlice';

/**
 * https://redux-toolkit.js.org/api/configureStore
 */
export const store = configureStore({
    reducer: {
        [pixalApi.reducerPath]: pixalApi.reducer,
        predicate: predicateReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: true,
            immutableCheck: true,
        }).concat(pixalApi.middleware),
});
