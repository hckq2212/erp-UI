import { api } from '../store/api';

export const taskResultChecksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTaskResultCheck: builder.query({
      query: (taskId) => `/task-result-checks/task/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: 'TaskResultChecks', id: taskId }],
    }),
    toggleResultCheckItem: builder.mutation({
      query: ({ taskId, kind, itemId, confirmed }) => ({
        url: `/task-result-checks/task/${taskId}/toggle`,
        method: 'PATCH',
        body: { kind, itemId, confirmed },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskResultChecks', id: taskId }],
    }),
    toggleResultCheckItems: builder.mutation({
      query: ({ taskId, kind, itemIds, confirmed }) => ({
        url: `/task-result-checks/task/${taskId}/toggle-bulk`,
        method: 'PATCH',
        body: { kind, itemIds, confirmed },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskResultChecks', id: taskId }],
    }),
    finalizeResultCheck: builder.mutation({
      query: (taskId) => ({
        url: `/task-result-checks/task/${taskId}/finalize`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, taskId) => [{ type: 'TaskResultChecks', id: taskId }],
    }),
    rerunResultCheck: builder.mutation({
      query: ({ taskId, kind, whitelist }) => ({
        url: `/task-result-checks/task/${taskId}/rerun`,
        method: 'PATCH',
        body: { kind, whitelist },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'TaskResultChecks', id: taskId }],
    }),
  }),
});

export const {
  useGetTaskResultCheckQuery,
  useToggleResultCheckItemMutation,
  useToggleResultCheckItemsMutation,
  useFinalizeResultCheckMutation,
  useRerunResultCheckMutation,
} = taskResultChecksApi;
