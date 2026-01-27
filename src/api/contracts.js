import { api } from '../store/api';

export const contractsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getContracts: builder.query({
      query: (params) => ({
        url: '/contracts',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Contracts', id })),
              { type: 'Contracts', id: 'LIST' },
            ]
          : [{ type: 'Contracts', id: 'LIST' }],
    }),
    getContract: builder.query({
      query: (id) => `/contracts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Contracts', id }],
    }),
    createContract: builder.mutation({
      query: (data) => ({
        url: '/contracts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Contracts', id: 'LIST' }],
    }),
    updateContract: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/contracts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contracts', id },
        { type: 'Contracts', id: 'LIST' },
      ],
    }),
    deleteContract: builder.mutation({
      query: (id) => ({
        url: `/contracts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Contracts', id: 'LIST' }],
    }),
    updateContractStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/contracts/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contracts', id },
        { type: 'Contracts', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetContractsQuery,
  useGetContractQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
  useUpdateContractStatusMutation,
} = contractsApi;
