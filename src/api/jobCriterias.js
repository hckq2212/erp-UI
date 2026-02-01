import { api } from '../store/api';

export const jobCriteriasApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getJobCriteriasByJob: builder.query({
            query: (jobId) => `/job-criterias/job/${jobId}`,
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
                url: '/job-criterias',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'JobCriterias', id: 'LIST' }],
        }),
        deleteJobCriteria: builder.mutation({
            query: (id) => ({
                url: `/job-criterias/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'JobCriterias', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetJobCriteriasByJobQuery,
    useCreateJobCriteriaMutation,
    useDeleteJobCriteriaMutation,
} = jobCriteriasApi;
