import { api } from '../store/api';

export const opportunitiesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOpportunities: builder.query({
      query: (params) => ({
        url: '/opportunities',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Opportunities', id })),
            { type: 'Opportunities', id: 'LIST' },
          ]
          : [{ type: 'Opportunities', id: 'LIST' }],
    }),
    getOpportunity: builder.query({
      query: (id) => `/opportunities/${id}`,
      providesTags: (result, error, id) => [{ type: 'Opportunities', id }],
    }),
    createOpportunity: builder.mutation({
      query: (data) => ({
        url: '/opportunities',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        { type: 'Opportunities', id: 'LIST' },
        { type: 'Opportunities', id: result?.id },
      ],
    }),
    updateOpportunity: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/opportunities/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Opportunities', id },
        { type: 'Opportunities', id: 'LIST' },
      ],
    }),
    deleteOpportunity: builder.mutation({
      query: (id) => ({
        url: `/opportunities/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Opportunities', id: 'LIST' }],
    }),
    updateOpportunityStage: builder.mutation({
      query: ({ id, stage }) => ({
        url: `/opportunities/${id}/stage`,
        method: 'PATCH',
        body: { stage },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Opportunities', id },
        { type: 'Opportunities', id: 'LIST' },
      ],
    }),
    approveOpportunity: builder.mutation({
      query: (id) => ({
        url: `/opportunities/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Opportunities', id },
        { type: 'Opportunities', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetOpportunitiesQuery,
  useGetOpportunityQuery,
  useLazyGetOpportunityQuery,
  useCreateOpportunityMutation,
  useUpdateOpportunityMutation,
  useDeleteOpportunityMutation,
  useUpdateOpportunityStageMutation,
  useApproveOpportunityMutation,
} = opportunitiesApi;
