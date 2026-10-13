import { api } from '../store/api';

export const paymentRequestsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getPaymentRequests: builder.query({
            query: (params) => ({
                url: '/payment-requests',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'PaymentRequests', id })),
                        { type: 'PaymentRequests', id: 'LIST' },
                    ]
                    : [{ type: 'PaymentRequests', id: 'LIST' }],
        }),
        getPaymentRequest: builder.query({
            query: (id) => `/payment-requests/${id}`,
            providesTags: (result, error, id) => [{ type: 'PaymentRequests', id }],
        }),
        getPaymentRequestsTotalDebt: builder.query({
            query: (params) => ({
                url: '/payment-requests/total-debt',
                params,
            }),
            providesTags: [{ type: 'PaymentRequests', id: 'TOTAL_DEBT' }],
        }),
        uploadPaymentRequestInvoiceFile: builder.mutation({
            query: (file) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: '/payment-requests/upload-invoice',
                    method: 'POST',
                    body: formData,
                };
            },
        }),
        createPaymentRequest: builder.mutation({
            query: (data) => ({
                url: '/payment-requests',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'PaymentRequests', id: 'LIST' }],
        }),
        updatePaymentRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-requests/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
        submitPaymentRequest: builder.mutation({
            query: (id) => ({
                url: `/payment-requests/${id}/submit`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
        supplementPaymentRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-requests/${id}/supplement`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
        deletePaymentRequest: builder.mutation({
            query: (id) => ({
                url: `/payment-requests/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'PaymentRequests', id: 'LIST' }],
        }),
        addPaymentRequestInvoicePdf: builder.mutation({
            query: ({ id, ...file }) => ({
                url: `/payment-requests/${id}/invoice-pdfs`,
                method: 'POST',
                body: file,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'PaymentRequests', id }],
        }),
        reviewPaymentRequest: builder.mutation({
            query: ({ id, action, note }) => ({
                url: `/payment-requests/${id}/review`,
                method: 'POST',
                body: { action, note },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
        bodDecidePaymentRequest: builder.mutation({
            query: ({ id, action, reason, confirmedDueDate }) => ({
                url: `/payment-requests/${id}/bod-decision`,
                method: 'POST',
                body: { action, reason, confirmedDueDate },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
        payPaymentRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-requests/${id}/pay`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
                { type: 'PaymentRequests', id: 'TOTAL_DEBT' },
            ],
        }),
        cancelPaymentRequest: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/payment-requests/${id}/cancel`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
                { type: 'PaymentRequests', id: 'TOTAL_DEBT' },
            ],
        }),
        uploadPaymentRequestProof: builder.mutation({
            query: ({ id, ...file }) => ({
                url: `/payment-requests/${id}/payment-proofs`,
                method: 'POST',
                body: file,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'PaymentRequests', id }],
        }),
        getServiceBudget: builder.query({
            query: (params) => ({
                url: '/payment-requests/service-budget',
                params,
            }),
        }),
        recordPaymentRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-requests/${id}/record-payment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
                { type: 'PaymentRequests', id: 'TOTAL_DEBT' },
            ],
        }),
        submitSettlementPaymentRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-requests/${id}/submit-settlement`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
        approveSettlementPaymentRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-requests/${id}/approve-settlement`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
                { type: 'PaymentRequests', id: 'TOTAL_DEBT' },
            ],
        }),
        rejectSettlementPaymentRequest: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/payment-requests/${id}/reject-settlement`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
        getNextPaymentRequestStt: builder.query({
            query: () => '/payment-requests/next-stt',
        }),
        generateWordAndUploadPaymentRequestDoc: builder.mutation({
            query: (data) => ({
                url: '/payment-requests/generate-word-and-upload',
                method: 'POST',
                body: data,
            }),
        }),
        getPaymentRequestDocPreview: builder.query({
            query: (id) => `/payment-requests/${id}/doc-preview`,
            providesTags: (result, error, id) => [{ type: 'PaymentRequests', id: `DOC_PREVIEW_${id}` }],
        }),
        syncGoogleSheetPaymentRequest: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-requests/${id}/sync-google-sheet`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentRequests', id },
                { type: 'PaymentRequests', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetPaymentRequestsQuery,
    useGetPaymentRequestQuery,
    useGetPaymentRequestsTotalDebtQuery,
    useUploadPaymentRequestInvoiceFileMutation,
    useCreatePaymentRequestMutation,
    useUpdatePaymentRequestMutation,
    useSubmitPaymentRequestMutation,
    useSupplementPaymentRequestMutation,
    useDeletePaymentRequestMutation,
    useCancelPaymentRequestMutation,
    useAddPaymentRequestInvoicePdfMutation,
    useReviewPaymentRequestMutation,
    useBodDecidePaymentRequestMutation,
    usePayPaymentRequestMutation,
    useUploadPaymentRequestProofMutation,
    useGetServiceBudgetQuery,
    useLazyGetServiceBudgetQuery,
    useRecordPaymentRequestMutation,
    useSubmitSettlementPaymentRequestMutation,
    useApproveSettlementPaymentRequestMutation,
    useRejectSettlementPaymentRequestMutation,
    useGetNextPaymentRequestSttQuery,
    useLazyGetNextPaymentRequestSttQuery,
    useGenerateWordAndUploadPaymentRequestDocMutation,
    useGetPaymentRequestDocPreviewQuery,
    useLazyGetPaymentRequestDocPreviewQuery,
    useSyncGoogleSheetPaymentRequestMutation,
} = paymentRequestsApi;


