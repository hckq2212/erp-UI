import { api } from '../store/api';

export const jobsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: () => '/jobs',
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Jobs', id })),
            { type: 'Jobs', id: 'LIST' },
          ]
          : [{ type: 'Jobs', id: 'LIST' }],
    }),
    getJob: builder.query({
      query: (id) => `/jobs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Jobs', id }],
    }),
    createJob: builder.mutation({
      query: (data) => ({
        url: '/jobs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Jobs', id: 'LIST' }],
    }),
    updateJob: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Jobs', id },
        { type: 'Jobs', id: 'LIST' },
      ],
    }),
    deleteJob: builder.mutation({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Jobs', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} = jobsApi;
