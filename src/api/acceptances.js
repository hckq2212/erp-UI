import { api } from '../store/api';

export const acceptancesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAcceptanceRequests: builder.query({
            query: (params) => ({
                url: '/acceptance',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Acceptance', id })),
                        { type: 'Acceptance', id: 'LIST' },
                    ]
                    : [{ type: 'Acceptance', id: 'LIST' }],
        }),
        getAcceptanceRequest: builder.query({
            query: (id) => `/acceptance/${id}`,
            providesTags: (result, error, id) => [{ type: 'Acceptance', id }],
        }),
        createAcceptanceRequest: builder.mutation({
            query: (data) => ({
                url: '/acceptance/request',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [
                { type: 'Acceptance', id: 'LIST' },
                { type: 'Services', id: 'LIST' },
                { type: 'Projects', id: 'LIST' },
                { type: 'Tasks', id: 'LIST' },
                { type: 'Contracts', id: 'LIST' },
            ],
        }),
        approveAcceptanceRequest: builder.mutation({
            query: (id) => ({
                url: `/acceptance/${id}/approve`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Acceptance', id },
                { type: 'Acceptance', id: 'LIST' },
                { type: 'Services', id: 'LIST' },
                { type: 'Projects', id: 'LIST' },
                { type: 'Tasks', id: 'LIST' },
            ],
        }),
        rejectAcceptanceRequest: builder.mutation({
            query: ({ id, feedback }) => ({
                url: `/acceptance/${id}/reject`,
                method: 'POST',
                body: { feedback },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Acceptance', id },
                { type: 'Acceptance', id: 'LIST' },
                { type: 'Services', id: 'LIST' },
                { type: 'Projects', id: 'LIST' },
                { type: 'Tasks', id: 'LIST' },
            ],
        }),
        processAcceptanceRequest: builder.mutation({
            query: ({ id, decisions }) => ({
                url: `/acceptance/${id}/process`,
                method: 'POST',
                body: { decisions },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Acceptance', id },
                { type: 'Acceptance', id: 'LIST' },
                { type: 'Services', id: 'LIST' },
                { type: 'Projects', id: 'LIST' },
                { type: 'Tasks', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetAcceptanceRequestsQuery,
    useGetAcceptanceRequestQuery,
    useCreateAcceptanceRequestMutation,
    useApproveAcceptanceRequestMutation,
    useRejectAcceptanceRequestMutation,
    useProcessAcceptanceRequestMutation,
} = acceptancesApi;
