import { api } from '../store/api';

export const tasksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (params) => ({
        url: '/tasks',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Tasks', id })),
            { type: 'Tasks', id: 'LIST' },
          ]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    getTask: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Tasks', id }],
    }),
    getTasksByProject: builder.query({
      query: (projectId) => `/tasks/project/${projectId}`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Tasks', id })),
            { type: 'Tasks', id: 'LIST' },
          ]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    getTasksByAssignee: builder.query({
      query: (userId) => `/tasks/assignee/${userId}`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Tasks', id })),
            { type: 'Tasks', id: 'LIST' },
          ]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    getAssigneeDailyWorkload: builder.query({
      query: ({ userId, startDate, endDate }) => ({
        url: `/tasks/assignee/${userId}/daily-workload`,
        params: { startDate, endDate },
      }),
      providesTags: [{ type: 'Tasks', id: 'DAILY_WORKLOAD' }],
    }),
    getTasksByOpportunity: builder.query({
      query: (opportunityId) => `/tasks/opportunity/${opportunityId}`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Tasks', id })),
            { type: 'Tasks', id: 'LIST' },
          ]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    createTask: builder.mutation({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    updateTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    updateTaskNickname: builder.mutation({
      query: ({ id, nickname }) => ({
        url: `/tasks/${id}/nickname`,
        method: 'PATCH',
        body: { nickname },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Dashboard' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' },
      ],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, { type: 'Projects', id: 'LIST' }],
    }),
    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    assignTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/assign`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    startTask: builder.mutation({
      query: ({ id }) => ({
        url: `/tasks/${id}/start`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Dashboard' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' },
      ],
    }),
    submitTaskResult: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/submit-result`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'TaskReviews', id: 'LIST' },
        { type: 'TaskResultChecks', id },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    submitTaskResultFile: builder.mutation({
      query: ({ id, file, sheetNames, whitelist, scenarioIds, scenarioLabels }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (sheetNames?.length) formData.append('sheetNames', sheetNames.join(','));
        if (whitelist?.length) formData.append('whitelist', whitelist.join(','));
        if (scenarioIds?.length) formData.append('scenarioIds', scenarioIds.join(','));
        if (scenarioLabels?.length) formData.append('scenarioLabels', JSON.stringify(scenarioLabels));
        return {
          url: `/tasks/${id}/submit-result-file`,
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'TaskReviews', id: 'LIST' },
        { type: 'TaskResultChecks', id },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    updatePricing: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/pricing`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    assessExtraTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/pricing`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    createInternalTask: builder.mutation({
      query: (data) => ({
        url: '/tasks/internal',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
    }),
    requestSupport: builder.mutation({
      query: ({ id, note }) => ({
        url: `/tasks/${id}/request-support`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    requestTaskStaffing: builder.mutation({
      query: ({ id, note }) => ({
        url: `/tasks/${id}/request-staffing`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : null,
      ].filter(Boolean),
    }),
    respondTaskStaffing: builder.mutation({
      query: ({ id, action }) => ({
        url: `/tasks/${id}/respond-staffing`,
        method: 'PATCH',
        body: { action },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : null,
      ].filter(Boolean),
    }),
    createSubtask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/subtasks`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        result?.id ? { type: 'Tasks', id: result.id } : null,
        projectId ? { type: 'Projects', id: projectId } : null,
        { type: 'Dashboard' },
      ].filter(Boolean),
    }),
    updateSubtask: builder.mutation({
      query: ({ id, name, assigneeId, allocationPercent, description }) => ({
        url: `/tasks/${id}/subtask`,
        method: 'PATCH',
        body: { name, assigneeId, allocationPercent, description },
      }),
      invalidatesTags: (result, error, { id, parentTaskId, projectId }) => [
        { type: 'Tasks', id },
        parentTaskId ? { type: 'Tasks', id: parentTaskId } : null,
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : null,
      ].filter(Boolean),
    }),
    submitSubtaskPlan: builder.mutation({
      query: ({ id }) => ({
        url: `/tasks/${id}/subtask-plan/submit`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : null,
      ].filter(Boolean),
    }),
    respondSubtaskPlan: builder.mutation({
      query: ({ id, action, note }) => ({
        url: `/tasks/${id}/subtask-plan/respond`,
        method: 'PATCH',
        body: { action, note },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : null,
      ].filter(Boolean),
    }),
    assignSupportTeam: builder.mutation({
      query: ({ id, teamId }) => ({
        url: `/tasks/${id}/assign-support-team`,
        method: 'POST',
        body: { teamId },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    respondToSupport: builder.mutation({
      query: ({ id, action }) => ({
        url: `/tasks/${id}/respond-support`,
        method: 'POST',
        body: { action },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    returnSupport: builder.mutation({
      query: ({ id }) => ({
        url: `/tasks/${id}/return-support`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    requestReturnSupport: builder.mutation({
      query: ({ id, note }) => ({
        url: `/tasks/${id}/request-return-support`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    requestRework: builder.mutation({
      query: ({ id, projectId, opportunityId, ...data }) => ({
        url: `/tasks/${id}/rework`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId, opportunityId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' },
        opportunityId ? { type: 'Opportunities', id: opportunityId } : null
      ].filter(Boolean),
    }),
    approveByCustomer: builder.mutation({
      query: ({ id }) => ({
        url: `/tasks/${id}/customer-approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id, projectId, opportunityId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' },
        opportunityId ? { type: 'Opportunities', id: opportunityId } : null
      ].filter(Boolean),
    }),
    markCustomerNotPurchased: builder.mutation({
      query: ({ id }) => ({
        url: `/tasks/${id}/customer-not-purchase`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id, projectId, opportunityId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' },
        opportunityId ? { type: 'Opportunities', id: opportunityId } : null
      ].filter(Boolean),
    }),
    bulkAssignTasks: builder.mutation({
      query: (data) => ({
        url: '/tasks/bulk-assign',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    bulkUnassignTasks: builder.mutation({
      query: ({ projectId, taskIds }) => ({
        url: '/tasks/bulk-unassign',
        method: 'PATCH',
        body: { projectId, taskIds },
      }),
      invalidatesTags: (result, error, { projectId, taskIds = [] }) => [
        ...taskIds.map((id) => ({ type: 'Tasks', id })),
        { type: 'Tasks', id: 'LIST' },
        { type: 'Projects', id: projectId },
        { type: 'Projects', id: 'LIST' },
        { type: 'Dashboard' },
      ],
    }),
    sendTaskReminder: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}/remind`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useGetTasksByProjectQuery,
  useGetTasksByAssigneeQuery,
  useGetAssigneeDailyWorkloadQuery,
  useGetTasksByOpportunityQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskNicknameMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useAssignTaskMutation,
  useStartTaskMutation,
  useSubmitTaskResultMutation,
  useSubmitTaskResultFileMutation,
  useUpdatePricingMutation,
  useAssessExtraTaskMutation,
  useCreateInternalTaskMutation,
  useRequestSupportMutation,
  useRequestTaskStaffingMutation,
  useRespondTaskStaffingMutation,
  useCreateSubtaskMutation,
  useUpdateSubtaskMutation,
  useSubmitSubtaskPlanMutation,
  useRespondSubtaskPlanMutation,
  useAssignSupportTeamMutation,
  useRespondToSupportMutation,
  useReturnSupportMutation,
  useRequestReturnSupportMutation,
  useRequestReworkMutation,
  useApproveByCustomerMutation,
  useMarkCustomerNotPurchasedMutation,
  useBulkAssignTasksMutation,
  useBulkUnassignTasksMutation,
  useSendTaskReminderMutation,
} = tasksApi;
