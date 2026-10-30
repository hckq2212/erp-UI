import { api } from '../store/api';

const getAddendumPayload = (result) => result?.addendum || result;

const getAddendumInvalidationTags = (result, id) => {
    const addendum = getAddendumPayload(result);

    return [
        { type: 'ContractAddendums', id },
        { type: 'ContractAddendums', id: 'LIST' },
        addendum?.contract?.id ? { type: 'Contracts', id: addendum.contract.id } : null,
        { type: 'Contracts', id: 'LIST' },
        addendum?.project?.id ? { type: 'Projects', id: addendum.project.id } : null,
        addendum?.project?.id ? { type: 'Projects', id: 'LIST' } : null,
        addendum?.project?.id ? { type: 'Tasks', id: 'LIST' } : null,
        addendum?.project?.id ? { type: 'PaymentRequests', id: `PROJECT_BUDGET_${addendum.project.id}` } : null,
    ].filter(Boolean);
};

export const contractAddendumsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getContractAddendums: builder.query({
            query: (params) => ({
                url: '/contract-addendums',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'ContractAddendums', id })),
                        { type: 'ContractAddendums', id: 'LIST' },
                    ]
                    : [{ type: 'ContractAddendums', id: 'LIST' }],
        }),
        getContractAddendum: builder.query({
            query: (id) => `/contract-addendums/${id}`,
            providesTags: (result, error, id) => [{ type: 'ContractAddendums', id }],
        }),
        createContractAddendum: builder.mutation({
            query: (data) => ({
                url: '/contract-addendums',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [
                { type: 'ContractAddendums', id: 'LIST' },
                { type: 'Contracts', id: 'LIST' },
            ],
        }),
        addAddendumItems: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/contract-addendums/${id}/items`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ContractAddendums', id },
                { type: 'ContractAddendums', id: 'LIST' },
            ],
        }),
        uploadSignedAddendum: builder.mutation({
            query: ({ id, file }) => ({
                url: `/contract-addendums/${id}/upload-signed`,
                method: 'POST',
                body: { file },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ContractAddendums', id },
                { type: 'ContractAddendums', id: 'LIST' },
            ],
        }),
        scaleDownAddendum: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/contract-addendums/${id}/scale-down`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ContractAddendums', id },
                { type: 'ContractAddendums', id: 'LIST' },
                { type: 'Contracts', id: 'LIST' },
            ],
        }),
        saleApproveAddendum: builder.mutation({
            query: ({ id, note, selectedItems }) => ({
                url: `/contract-addendums/${id}/sale-approve`,
                method: 'POST',
                body: { note, selectedItems },
            }),
            invalidatesTags: (result, error, { id }) => getAddendumInvalidationTags(result, id),
        }),
        saleRejectAddendum: builder.mutation({
            query: ({ id, note }) => ({
                url: `/contract-addendums/${id}/sale-reject`,
                method: 'POST',
                body: { note },
            }),
            invalidatesTags: (result, error, { id }) => getAddendumInvalidationTags(result, id),
        }),
        resubmitAddendum: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/contract-addendums/${id}/resubmit`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => getAddendumInvalidationTags(result, id),
        }),
        bodApproveAddendum: builder.mutation({
            query: ({ id, note }) => ({
                url: `/contract-addendums/${id}/bod-approve`,
                method: 'POST',
                body: { note },
            }),
            invalidatesTags: (result, error, { id }) => getAddendumInvalidationTags(result, id),
        }),
        bodRejectAddendum: builder.mutation({
            query: ({ id, note }) => ({
                url: `/contract-addendums/${id}/bod-reject`,
                method: 'POST',
                body: { note },
            }),
            invalidatesTags: (result, error, { id }) => getAddendumInvalidationTags(result, id),
        }),
    }),
});

export const {
    useGetContractAddendumsQuery,
    useGetContractAddendumQuery,
    useCreateContractAddendumMutation,
    useAddAddendumItemsMutation,
    useUploadSignedAddendumMutation,
    useScaleDownAddendumMutation,
    useSaleApproveAddendumMutation,
    useSaleRejectAddendumMutation,
    useResubmitAddendumMutation,
    useBodApproveAddendumMutation,
    useBodRejectAddendumMutation,
} = contractAddendumsApi;
