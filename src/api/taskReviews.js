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
            query: ({ taskId, reviewNote }) => ({
                url: `/task-reviews/task/${taskId}/finalize`,
                method: 'POST',
                body: { reviewNote },
            }),
            invalidatesTags: (result, error, { taskId, projectId }) => [
                { type: 'Tasks', id: taskId },
                { type: 'Tasks', id: 'LIST' },
                { type: 'TaskReviews', id: 'LIST' },
                projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
            ].filter(Boolean),
        }),
        rejectTask: builder.mutation({
            query: ({ taskId, reviewNote }) => ({
                url: `/task-reviews/task/${taskId}/reject`,
                method: 'POST',
                body: { reviewNote },
            }),
            invalidatesTags: (result, error, { taskId, projectId }) => [
                { type: 'Tasks', id: taskId },
                { type: 'Tasks', id: 'LIST' },
                { type: 'TaskReviews', id: 'LIST' },
                projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
            ].filter(Boolean),
        }),
    }),
});

export const {
    useGetTaskReviewsQuery,
    useToggleTaskReviewPassedMutation,
    useFinalizeTaskMutation,
    useRejectTaskMutation,
} = taskReviewsApi;
