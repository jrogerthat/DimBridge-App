import {configureStore} from '@reduxjs/toolkit';
import {pixalApi} from "../services/pixal";
import annotationReducer from '../slices/clauseSlice';

/**
 * https://redux-toolkit.js.org/api/configureStore
 */
export const store = configureStore({
    reducer: {
        [pixalApi.reducerPath]: pixalApi.reducer,
        clause: annotationReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(pixalApi.middleware),
});
