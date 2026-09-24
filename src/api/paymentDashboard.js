import { api } from '../store/api';

export const paymentDashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentDashboard: builder.query({
      query: (params) => ({ url: '/payment-dashboard', params }),
      providesTags: [{ type: 'PaymentDashboard', id: 'LIST' }],
    }),
    getFinanceDocuments: builder.query({
      query: (contractId) => `/finance-documents/contracts/${contractId}`,
      providesTags: (result, error, contractId) => [{ type: 'FinanceDocuments', id: contractId }],
    }),
    createAcceptanceMinute: builder.mutation({
      query: (body) => ({ url: '/finance-documents/acceptance-minutes', method: 'POST', body }),
      invalidatesTags: (result, error, body) => [
        { type: 'FinanceDocuments', id: body.contractId },
        { type: 'PaymentDashboard', id: 'LIST' },
      ],
    }),
    createVatInvoice: builder.mutation({
      query: (body) => ({ url: '/finance-documents/vat-invoices', method: 'POST', body }),
      invalidatesTags: (result, error, body) => [
        { type: 'FinanceDocuments', id: body.contractId },
        { type: 'PaymentDashboard', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPaymentDashboardQuery,
  useGetFinanceDocumentsQuery,
  useCreateAcceptanceMinuteMutation,
  useCreateVatInvoiceMutation,
} = paymentDashboardApi;
