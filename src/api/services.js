import { api } from '../store/api';

export const servicesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query({
      query: (params) => ({
        url: '/services',
        params,
      }),
      providesTags: (result) => {
        const services = Array.isArray(result) ? result : (result?.data || []);
        return result
          ? [
            ...services.map(({ id }) => ({ type: 'Services', id })),
            { type: 'Services', id: 'LIST' },
          ]
          : [{ type: 'Services', id: 'LIST' }];
      },
    }),
    getService: builder.query({
      query: (id) => `/services/${id}`,
      providesTags: (result, error, id) => [{ type: 'Services', id }],
    }),
    createService: builder.mutation({
      query: (data) => ({
        url: '/services',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Services', id: 'LIST' }],
    }),
    updateService: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/services/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Services', id },
        { type: 'Services', id: 'LIST' },
      ],
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `/services/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Services', id: 'LIST' }],
    }),
    bulkDeleteServices: builder.mutation({
      query: (ids) => ({
        url: '/services/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Services', id: 'LIST' }],
    }),
    addJob: builder.mutation({
      query: ({ id, jobId }) => ({
        url: `/services/${id}/jobs/${jobId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Services', id },
        { type: 'Services', id: 'LIST' },
      ],
    }),
    removeJob: builder.mutation({
      query: ({ id, jobId }) => ({
        url: `/services/${id}/jobs/${jobId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Services', id },
        { type: 'Services', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useBulkDeleteServicesMutation,
  useAddJobMutation,
  useRemoveJobMutation,
} = servicesApi;
