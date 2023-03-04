import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
import {env} from "../env";

const BASE_URL = env("REACT_APP_BACKEND_API");

/**
 * https://redux-toolkit.js.org/rtk-query/api/createApi
 */
export const pixalApi = createApi({
    reducerPath: 'pixalApi',
    baseQuery: fetchBaseQuery({baseUrl: BASE_URL}),
    endpoints: (builder) => ({
        /**
         * The raw data and projections. Depends on the dataset name and projection algorithm.
         */
        getData: builder.query({
            query: ([dataset_name, projection_algorithm]) => {
                return {
                    url: 'data',
                    params: {'dataset': dataset_name, 'projection_algorithm': projection_algorithm},
                };
            },
        }),
    }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useGetDataQuery} = pixalApi;