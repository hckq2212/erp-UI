import { api } from '../store/api';

export const contractsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getContracts: builder.query({
      query: (params) => ({
        url: '/contracts',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Contracts', id })),
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
      invalidatesTags: (result, error, data) => [
        { type: 'Contracts', id: 'LIST' },
        { type: 'Opportunities', id: data.opportunityId },
        { type: 'Opportunities', id: 'LIST' },
      ],
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
    updateContractServiceNickname: builder.mutation({
      query: ({ id, nickname }) => ({
        url: `/contracts/services/${id}/nickname`,
        method: 'PATCH',
        body: { nickname },
      }),
      invalidatesTags: (result, error, { contractId, projectId }) => [
        contractId ? { type: 'Contracts', id: contractId } : { type: 'Contracts', id: 'LIST' },
        { type: 'Contracts', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' },
      ],
    }),
    uploadProposal: builder.mutation({
      query: ({ id, file, contractLink, quotationLink }) => ({
        url: `/contracts/${id}/proposal`,
        method: 'POST',
        body: { file, contractLink, quotationLink },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contracts', id },
        { type: 'Contracts', id: 'LIST' },
      ],
    }),
    approveProposal: builder.mutation({
      query: (id) => ({
        url: `/contracts/${id}/approve-proposal`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contracts', id },
        { type: 'Contracts', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    uploadSigned: builder.mutation({
      query: ({ id, file }) => ({
        url: `/contracts/${id}/signed`,
        method: 'POST',
        body: { file },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contracts', id },
        { type: 'Contracts', id: 'LIST' },
        { type: 'PaymentMilestones', id: 'LIST' },
        { type: 'Debts', id: 'LIST' },
      ],
    }),
    addMilestone: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/contracts/${id}/milestones`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contracts', id },
        { type: 'Contracts', id: 'LIST' },
      ],
    }),
    updateMilestone: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/contracts/milestones/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contracts', id: result?.contractId },
        { type: 'Contracts', id: 'LIST' },
      ],
    }),
    deleteMilestone: builder.mutation({
      query: (id) => ({
        url: `/contracts/milestones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contracts', id: result?.contractId },
        { type: 'Contracts', id: 'LIST' },
      ],
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
    rejectProposal: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/contracts/${id}/reject-proposal`,
        method: 'POST',
        body: { reason },
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
  useUpdateContractServiceNicknameMutation,
  useUploadProposalMutation,
  useApproveProposalMutation,
  useRejectProposalMutation,
  useUploadSignedMutation,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useUpdateContractStatusMutation,
} = contractsApi;
