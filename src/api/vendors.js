import { api } from '../store/api';

export const vendorsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getVendors: builder.query({
            query: (params) => ({
                url: '/vendors',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Vendors', id })),
                        { type: 'Vendors', id: 'LIST' },
                    ]
                    : [{ type: 'Vendors', id: 'LIST' }],
        }),
        getVendor: builder.query({
            query: (id) => `/vendors/${id}`,
            providesTags: (result, error, id) => [{ type: 'Vendors', id }],
        }),
        createVendor: builder.mutation({
            query: (data) => ({
                url: '/vendors',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Vendors', id: 'LIST' }],
        }),
        updateVendor: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/vendors/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Vendors', id },
                { type: 'Vendors', id: 'LIST' },
            ],
        }),
        deleteVendor: builder.mutation({
            query: (id) => ({
                url: `/vendors/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Vendors', id: 'LIST' }],
        }),
        getVendorJobs: builder.query({
            query: (id) => `/vendors/${id}/jobs`,
            providesTags: (result, error, id) => [{ type: 'VendorJobs', id }],
        }),
        addVendorJob: builder.mutation({
            query: ({ id, jobId, ...data }) => ({
                url: `/vendors/${id}/jobs/${jobId}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'VendorJobs', id },
                { type: 'Vendors', id },
                { type: 'Jobs', id: 'LIST' },
                { type: 'Services', id: 'LIST' },
            ],
        }),
        updateVendorJob: builder.mutation({
            query: ({ id, jobId, ...data }) => ({
                url: `/vendors/${id}/jobs/${jobId}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'VendorJobs', id },
                { type: 'Vendors', id },
                { type: 'Jobs', id: 'LIST' },
                { type: 'Services', id: 'LIST' },
            ],
        }),
        removeVendorJob: builder.mutation({
            query: ({ id, jobId }) => ({
                url: `/vendors/${id}/jobs/${jobId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'VendorJobs', id },
                { type: 'Vendors', id },
                { type: 'Jobs', id: 'LIST' },
                { type: 'Services', id: 'LIST' },
            ],
        }),
        getVendorsByJob: builder.query({
            query: (jobId) => `/vendors/by-job/${jobId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Vendors', id })),
                        { type: 'Vendors', id: 'LIST' },
                    ]
                    : [{ type: 'Vendors', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetVendorsQuery,
    useGetVendorQuery,
    useCreateVendorMutation,
    useUpdateVendorMutation,
    useDeleteVendorMutation,
    useGetVendorJobsQuery,
    useAddVendorJobMutation,
    useUpdateVendorJobMutation,
    useRemoveVendorJobMutation,
    useGetVendorsByJobQuery,
} = vendorsApi;
