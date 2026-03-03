import { api } from '../store/api';

export const servicePackagesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getServicePackages: builder.query({
            query: () => '/service-packages',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'ServicePackages', id })),
                        { type: 'ServicePackages', id: 'LIST' },
                    ]
                    : [{ type: 'ServicePackages', id: 'LIST' }],
        }),
        getServicePackage: builder.query({
            query: (id) => `/service-packages/${id}`,
            providesTags: (result, error, id) => [{ type: 'ServicePackages', id }],
        }),
        createServicePackage: builder.mutation({
            query: (data) => ({
                url: '/service-packages',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'ServicePackages', id: 'LIST' }],
        }),
        updateServicePackage: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/service-packages/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ServicePackages', id },
                { type: 'ServicePackages', id: 'LIST' },
            ],
        }),
        deleteServicePackage: builder.mutation({
            query: (id) => ({
                url: `/service-packages/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'ServicePackages', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetServicePackagesQuery,
    useGetServicePackageQuery,
    useCreateServicePackageMutation,
    useUpdateServicePackageMutation,
    useDeleteServicePackageMutation,
} = servicePackagesApi;
