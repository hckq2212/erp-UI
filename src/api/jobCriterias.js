import { api } from '../store/api';

export const jobCriteriasApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getJobCriteriasByJob: builder.query({
            query: (jobId) => `/job-criteria/job/${jobId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'JobCriterias', id })),
                        { type: 'JobCriterias', id: 'LIST' },
                    ]
                    : [{ type: 'JobCriterias', id: 'LIST' }],
        }),
        createJobCriteria: builder.mutation({
            query: (data) => ({
                url: '/job-criteria',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'JobCriterias', id: 'LIST' }, { type: 'Jobs' }],
        }),
        deleteJobCriteria: builder.mutation({
            query: (id) => ({
                url: `/job-criteria/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'JobCriterias', id: 'LIST' }, { type: 'Jobs' }],
        }),
        syncJobCriteria: builder.mutation({
            query: ({ id, criteria }) => ({
                url: `/job-criteria/job/${id}`,
                method: 'PUT',
                body: criteria,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'JobCriterias', id },
                { type: 'JobCriterias', id: 'LIST' },
                { type: 'Jobs', id },
                { type: 'Jobs', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetJobCriteriasByJobQuery,
    useCreateJobCriteriaMutation,
    useDeleteJobCriteriaMutation,
    useSyncJobCriteriaMutation,
} = jobCriteriasApi;
