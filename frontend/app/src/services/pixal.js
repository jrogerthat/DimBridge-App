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
            query: ([datasetName, projectionAlgorithm]) => {
                return {
                    url: 'data',
                    params: {'dataset': datasetName, 'projection_algorithm': projectionAlgorithm},
                };
            },
        }),
        /**
         * The predicates from pixal. Depends on the dataset name, projection algorithm, and selected points.
         */
        getPixalPredicates: builder.query({
            query: ([datasetName, ids]) => {
                return {
                    url: 'predicates',
                    params: {'dataset': datasetName, 'selected_ids': ids},
                };
            }
        }),
        getPixalScores: builder.query({
            query: ([datasetName, ids, predicates]) => {
                return {
                    url: 'scores',
                    params: {'dataset': datasetName, 'selected_ids': ids, 'predicates': predicates},
                };
            },
        }),
    }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useGetDataQuery, useLazyGetPixalPredicatesQuery, useGetPixalScoresQuery} = pixalApi;
