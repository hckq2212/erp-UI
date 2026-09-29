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
      invalidatesTags: (result, error, { taskId, kind }) => [
        { type: 'TaskResultChecks', id: taskId },
        ...(kind === 'SPELL' ? [{ type: 'ProjectSpellCheckWhitelist' }] : []),
      ],
    }),
    toggleResultCheckItems: builder.mutation({
      query: ({ taskId, kind, itemIds, confirmed }) => ({
        url: `/task-result-checks/task/${taskId}/toggle-bulk`,
        method: 'PATCH',
        body: { kind, itemIds, confirmed },
      }),
      invalidatesTags: (result, error, { taskId, kind }) => [
        { type: 'TaskResultChecks', id: taskId },
        ...(kind === 'SPELL' ? [{ type: 'ProjectSpellCheckWhitelist' }] : []),
      ],
    }),
    finalizeResultCheck: builder.mutation({
      query: (taskId) => ({
        url: `/task-result-checks/task/${taskId}/finalize`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, taskId) => [{ type: 'TaskResultChecks', id: taskId }],
    }),
    getTaskResultCheckPreview: builder.query({
      query: ({ taskId, sheet, rowStart, rowCount, colStart, colCount }) => ({
        url: `/task-result-checks/task/${taskId}/preview`,
        params: { sheet, rowStart, rowCount, colStart, colCount },
      }),
      keepUnusedDataFor: 120,
    }),
    rerunResultCheck: builder.mutation({
      query: ({ taskId, kind, whitelist, scope }) => ({
        url: `/task-result-checks/task/${taskId}/rerun`,
        method: 'PATCH',
        body: { kind, whitelist, scope },
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
  useLazyGetTaskResultCheckPreviewQuery,
} = taskResultChecksApi;
