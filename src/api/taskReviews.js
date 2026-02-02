import { api } from '../store/api';

export const taskReviewsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTaskReviews: builder.query({
            query: (taskId) => `/task-reviews/task/${taskId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'TaskReviews', id })),
                        { type: 'TaskReviews', id: 'LIST' },
                    ]
                    : [{ type: 'TaskReviews', id: 'LIST' }],
        }),
        toggleTaskReviewPassed: builder.mutation({
            query: ({ id, isPassed, note }) => ({
                url: `/task-reviews/${id}/toggle`,
                method: 'PUT',
                body: { isPassed, note },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'TaskReviews', id },
                { type: 'TaskReviews', id: 'LIST' },
            ],
        }),
        finalizeTask: builder.mutation({
            query: (taskId) => ({
                url: `/task-reviews/task/${taskId}/finalize`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, taskId) => [
                { type: 'Tasks', id: taskId },
                { type: 'Tasks', id: 'LIST' },
                { type: 'TaskReviews', id: 'LIST' },
            ],
        }),
        rejectTask: builder.mutation({
            query: ({ taskId, note }) => ({
                url: `/task-reviews/task/${taskId}/reject`,
                method: 'POST',
                body: { note },
            }),
            invalidatesTags: (result, error, { taskId }) => [
                { type: 'Tasks', id: taskId },
                { type: 'Tasks', id: 'LIST' },
                { type: 'TaskReviews', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetTaskReviewsQuery,
    useToggleTaskReviewPassedMutation,
    useFinalizeTaskMutation,
    useRejectTaskMutation,
} = taskReviewsApi;
