import { api } from '../store/api';

export const tasksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (params) => ({
        url: '/tasks',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Tasks', id })),
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
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
      ],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
    }),
    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    assignTask: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/tasks/${id}/assign`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id, task }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
        task?.projectId ? { type: 'Projects', id: task.projectId } : null
      ].filter(Boolean),
    }),
    submitTaskResult: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/tasks/${id}/submit-result`,
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    updatePricing: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/pricing`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tasks', id },
        { type: 'Tasks', id: 'LIST' },
      ],
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
} = tasksApi;
