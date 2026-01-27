import { api } from '../store/api';

export const opportunitiesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOpportunities: builder.query({
      query: (params) => ({
        url: '/opportunities',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Opportunities', id })),
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
      invalidatesTags: [{ type: 'Opportunities', id: 'LIST' }],
    }),
    updateOpportunity: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/opportunities/${id}`,
        method: 'PUT',
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
  }),
});

export const {
  useGetOpportunitiesQuery,
  useGetOpportunityQuery,
  useCreateOpportunityMutation,
  useUpdateOpportunityMutation,
  useDeleteOpportunityMutation,
  useUpdateOpportunityStageMutation,
} = opportunitiesApi;
