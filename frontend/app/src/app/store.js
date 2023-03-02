import {configureStore} from '@reduxjs/toolkit';
import {pixalApi} from "../services/pixal";

export const store = configureStore({
    reducer: {
        [pixalApi.reducerPath]: pixalApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(pixalApi.middleware),
});
