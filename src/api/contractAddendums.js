import { api } from '../store/api';

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
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: `/contract-addendums/${id}/upload-signed`,
                    method: 'POST',
                    body: formData,
                };
            },
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
    }),
});

export const {
    useGetContractAddendumsQuery,
    useGetContractAddendumQuery,
    useCreateContractAddendumMutation,
    useAddAddendumItemsMutation,
    useUploadSignedAddendumMutation,
    useScaleDownAddendumMutation,
} = contractAddendumsApi;
