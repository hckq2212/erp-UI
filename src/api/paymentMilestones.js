import { api } from '../store/api';

export const paymentMilestonesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentMilestones: builder.query({
      query: (params) => ({
        url: '/payment-milestones',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PaymentMilestones', id })),
              { type: 'PaymentMilestones', id: 'LIST' },
            ]
          : [{ type: 'PaymentMilestones', id: 'LIST' }],
    }),
    getPaymentMilestone: builder.query({
      query: (id) => `/payment-milestones/${id}`,
      providesTags: (result, error, id) => [{ type: 'PaymentMilestones', id }],
    }),
    getPaymentMilestonesByContract: builder.query({
      query: (contractId) => `/payment-milestones/contract/${contractId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PaymentMilestones', id })),
              { type: 'PaymentMilestones', id: 'LIST' },
            ]
          : [{ type: 'PaymentMilestones', id: 'LIST' }],
    }),
    getPaymentMilestonesByProject: builder.query({
      query: (projectId) => `/payment-milestones/project/${projectId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PaymentMilestones', id })),
              { type: 'PaymentMilestones', id: 'LIST' },
            ]
          : [{ type: 'PaymentMilestones', id: 'LIST' }],
    }),
    createPaymentMilestone: builder.mutation({
      query: (data) => ({
        url: '/payment-milestones',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'PaymentMilestones', id: 'LIST' }],
    }),
    updatePaymentMilestone: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/payment-milestones/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PaymentMilestones', id },
        { type: 'PaymentMilestones', id: 'LIST' },
      ],
    }),
    deletePaymentMilestone: builder.mutation({
      query: (id) => ({
        url: `/payment-milestones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'PaymentMilestones', id: 'LIST' }],
    }),
    updatePaymentStatus: builder.mutation({
      query: ({ id, status, paidDate }) => ({
        url: `/payment-milestones/${id}/status`,
        method: 'PATCH',
        body: { status, paidDate },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PaymentMilestones', id },
        { type: 'PaymentMilestones', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPaymentMilestonesQuery,
  useGetPaymentMilestoneQuery,
  useGetPaymentMilestonesByContractQuery,
  useGetPaymentMilestonesByProjectQuery,
  useCreatePaymentMilestoneMutation,
  useUpdatePaymentMilestoneMutation,
  useDeletePaymentMilestoneMutation,
  useUpdatePaymentStatusMutation,
} = paymentMilestonesApi;
