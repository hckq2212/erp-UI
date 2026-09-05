import { api } from '../store/api';

export const projectsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: (params) => ({
        url: '/projects',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Projects', id })),
            { type: 'Projects', id: 'LIST' },
          ]
          : [{ type: 'Projects', id: 'LIST' }],
    }),
    getProject: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Projects', id }],
    }),
    getProjectsByContract: builder.query({
      query: (contractId) => `/projects/contract/${contractId}`,
      providesTags: (result) =>
        result
          ? [
            { type: 'Projects', id: result.id },
            { type: 'Projects', id: 'LIST' },
          ]
          : [{ type: 'Projects', id: 'LIST' }],
    }),
    createProject: builder.mutation({
      query: (data) => ({
        url: '/projects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
    }),
    updateProjectStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/projects/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    updateProjectProgress: builder.mutation({
      query: ({ id, progress }) => ({
        url: `/projects/${id}/progress`,
        method: 'PATCH',
        body: { progress },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    assignProject: builder.mutation({
      query: (data) => ({
        url: '/projects/assign',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
    }),
    confirmProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
      ],
    }),
    // Google Sheet integration is temporarily disabled.
    // retryProjectGoogleSheet: builder.mutation({
    //   query: (id) => ({
    //     url: `/projects/${id}/google-sheet/retry`,
    //     method: 'POST',
    //   }),
    //   invalidatesTags: (result, error, id) => [
    //     { type: 'Projects', id },
    //     { type: 'Projects', id: 'LIST' },
    //   ],
    // }),
    syncProjectServiceJobs: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}/sync-service-jobs`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
        { type: 'Tasks', id: 'LIST' },
      ],
    }),
    getMonthlyWorkTemplate: builder.query({
      query: ({ projectId, month }) => ({
        url: `/projects/${projectId}/monthly-work-template`,
        params: { month },
      }),
      providesTags: (result, error, { projectId }) => [{ type: 'Projects', id: projectId }],
    }),
    createMonthlyWorkAddendum: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/projects/${projectId}/monthly-work-addendums`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Projects', id: projectId },
        { type: 'Contracts', id: 'LIST' },
        { type: 'ContractAddendums', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetProjectsByContractQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectStatusMutation,
  useUpdateProjectProgressMutation,
  useAssignProjectMutation,
  useConfirmProjectMutation,
  // useRetryProjectGoogleSheetMutation,
  useSyncProjectServiceJobsMutation,
  useGetMonthlyWorkTemplateQuery,
  useCreateMonthlyWorkAddendumMutation,
} = projectsApi;
