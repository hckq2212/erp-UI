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
} = paymentRequestsApi;
