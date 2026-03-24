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
      query: (id) => ({
        url: `/tasks/${id}/return-support`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    requestRework: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/rework`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        projectId ? { type: 'Projects', id: projectId } : { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
    approveByCustomer: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}/customer-approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Projects', id: 'LIST' }
      ].filter(Boolean),
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useGetTasksByProjectQuery,
  useGetTasksByAssigneeQuery,
  useGetTasksByOpportunityQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useAssignTaskMutation,
  useSubmitTaskResultMutation,
  useUpdatePricingMutation,
  useAssessExtraTaskMutation,
  useCreateInternalTaskMutation,
  useRequestSupportMutation,
  useAssignSupportTeamMutation,
  useRespondToSupportMutation,
  useReturnSupportMutation,
  useRequestReworkMutation,
  useApproveByCustomerMutation,
} = tasksApi;
