import { api } from '../store/api';

export const quotationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query({
      query: (params) => ({
        url: '/quotations',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Quotations', id })),
              { type: 'Quotations', id: 'LIST' },
            ]
          : [{ type: 'Quotations', id: 'LIST' }],
    }),
    getQuotation: builder.query({
      query: (id) => `/quotations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quotations', id }],
    }),
    getQuotationsByOpportunity: builder.query({
      query: (opportunityId) => `/quotations/opportunity/${opportunityId}`,
      providesTags: (result, error, opportunityId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Quotations', id })),
              { type: 'Quotations', id: `OPPORTUNITY_${opportunityId}` },
            ]
          : [{ type: 'Quotations', id: `OPPORTUNITY_${opportunityId}` }],
    }),
    createQuotation: builder.mutation({
      query: (data) => ({
        url: '/quotations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        { type: 'Quotations', id: 'LIST' },
        { type: 'Quotations', id: `OPPORTUNITY_${data.opportunityId}` },
      ],
    }),
    updateQuotation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/quotations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
        // Also invalidate the opportunity-specific list
        ...(result?.opportunityId ? [{ type: 'Quotations', id: `OPPORTUNITY_${result.opportunityId}` }] : []),
      ],
    }),
    approveQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
    rejectQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
    deleteQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Quotations', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationQuery,
  useGetQuotationsByOpportunityQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useApproveQuotationMutation,
  useRejectQuotationMutation,
  useDeleteQuotationMutation,
} = quotationsApi;
