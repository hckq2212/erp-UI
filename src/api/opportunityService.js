import { api } from '../store/api';

export const opportunityServiceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOpportunityServicesByOpportunity: builder.query({
      query: (opportunityId) => `/opportunity-services/opportunity/${opportunityId}`,
      providesTags: (result, error, opportunityId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'OpportunityServices', id })),
              { type: 'OpportunityServices', id: 'LIST' },
              { type: 'OpportunityServices', id: `OPPORTUNITY_${opportunityId}` },
            ]
          : [
              { type: 'OpportunityServices', id: 'LIST' },
              { type: 'OpportunityServices', id: `OPPORTUNITY_${opportunityId}` },
            ],
    }),
    getOpportunityService: builder.query({
      query: (id) => `/opportunity-services/${id}`,
      providesTags: (result, error, id) => [{ type: 'OpportunityServices', id }],
    }),
    createOpportunityService: builder.mutation({
      query: (data) => ({
        url: '/opportunity-services',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'OpportunityServices', id: 'LIST' }],
    }),
    updateOpportunityService: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/opportunity-services/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'OpportunityServices', id },
        { type: 'OpportunityServices', id: 'LIST' },
      ],
    }),
    deleteOpportunityService: builder.mutation({
      query: (id) => ({
        url: `/opportunity-services/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'OpportunityServices', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetOpportunityServicesByOpportunityQuery,
  useGetOpportunityServiceQuery,
  useCreateOpportunityServiceMutation,
  useUpdateOpportunityServiceMutation,
  useDeleteOpportunityServiceMutation,
} = opportunityServiceApi;
