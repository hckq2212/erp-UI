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
    createQuotation: builder.mutation({
      query: (data) => ({
        url: '/quotations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Quotations', id: 'LIST' }],
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
      ],
    }),
    deleteQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Quotations', id: 'LIST' }],
    }),
    updateQuotationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/quotations/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quotations', id },
        { type: 'Quotations', id: 'LIST' },
      ],
    }),
    convertToContract: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}/convert`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Quotations', id: 'LIST' },
        { type: 'Contracts', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationStatusMutation,
  useConvertToContractMutation,
} = quotationsApi;
