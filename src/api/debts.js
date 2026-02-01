import { api } from '../store/api';

export const debtsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDebts: builder.query({
            query: (params) => ({
                url: '/debts',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Debts', id })),
                        { type: 'Debts', id: 'LIST' },
                    ]
                    : [{ type: 'Debts', id: 'LIST' }],
        }),
        getDebt: builder.query({
            query: (id) => `/debts/${id}`,
            providesTags: (result, error, id) => [{ type: 'Debts', id }],
        }),
        activateDebt: builder.mutation({
            query: (data) => ({
                url: '/debts/activate',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Debts', id: 'LIST' }],
        }),
        deleteDebt: builder.mutation({
            query: (id) => ({
                url: `/debts/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Debts', id: 'LIST' }],
        }),
        createPayment: builder.mutation({
            query: (data) => ({
                url: '/debts/payments',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { debtId }) => [
                { type: 'Debts', id: debtId },
                { type: 'Debts', id: 'LIST' },
            ],
        }),
        deletePayment: builder.mutation({
            query: (id) => ({
                url: `/debts/payments/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Debts', id: 'LIST' }],
        }),
        getDebtsByContract: builder.query({
            query: (contractId) => `/debts/contract/${contractId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Debts', id })),
                        { type: 'Debts', id: 'LIST' },
                    ]
                    : [{ type: 'Debts', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetDebtsQuery,
    useGetDebtQuery,
    useActivateDebtMutation,
    useDeleteDebtMutation,
    useCreatePaymentMutation,
    useDeletePaymentMutation,
    useGetDebtsByContractQuery,
} = debtsApi;
