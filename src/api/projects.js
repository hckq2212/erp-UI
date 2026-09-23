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
    updateProjectWorkingFiles: builder.mutation({
      query: ({ id, workingFiles }) => ({
        url: `/projects/${id}/working-files`,
        method: 'PATCH',
        body: { workingFiles },
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
      invalidatesTags: [{ type: 'Projects' }, { type: 'Teams' }],
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
    createProjectServiceAddendum: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/projects/${projectId}/service-addendums`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Projects', id: projectId },
        { type: 'Projects', id: 'LIST' },
        { type: 'Contracts', id: 'LIST' },
        { type: 'ContractAddendums', id: 'LIST' },
      ],
    }),
    getProjectProductDescriptions: builder.query({
      query: (projectId) => `/projects/${projectId}/product-descriptions`,
      providesTags: (result, error, projectId) => [
        { type: 'ProjectProductDescriptions', id: projectId },
      ],
    }),
    createProjectProductDescription: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/projects/${projectId}/product-descriptions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectProductDescriptions', id: projectId },
      ],
    }),
    updateProjectProductDescription: builder.mutation({
      query: ({ projectId, submissionId, ...data }) => ({
        url: `/projects/${projectId}/product-descriptions/${submissionId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectProductDescriptions', id: projectId },
      ],
    }),
    submitProjectProductDescription: builder.mutation({
      query: ({ projectId, submissionId, ...data }) => ({
        url: `/projects/${projectId}/product-descriptions/${submissionId}/submit`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectProductDescriptions', id: projectId },
      ],
    }),
    approveProjectProductDescription: builder.mutation({
      query: ({ projectId, submissionId }) => ({
        url: `/projects/${projectId}/product-descriptions/${submissionId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectProductDescriptions', id: projectId },
      ],
    }),
    rejectProjectProductDescription: builder.mutation({
      query: ({ projectId, submissionId, reviewNote }) => ({
        url: `/projects/${projectId}/product-descriptions/${submissionId}/reject`,
        method: 'POST',
        body: { reviewNote },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectProductDescriptions', id: projectId },
      ],
    }),
    getMyProjects: builder.query({
      query: () => '/projects/my-projects',
      providesTags: [{ type: 'Projects', id: 'MY_LIST' }],
    }),
    requestProjectStaffing: builder.mutation({
      query: ({ id, note }) => ({
        url: `/projects/${id}/request-staffing`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // TẠM DỪNG DỰ ÁN
    // ─────────────────────────────────────────────────────────────────────

    /** PM hoặc BD gửi yêu cầu tạm dừng → chờ BOD duyệt. */
    requestPauseProject: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/projects/${id}/pause`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
        { type: 'PauseHistory', id },
      ],
    }),

    /** BOD/ADMIN tạm dừng TRỰC TIẾP — không cần duyệt. */
    pauseProjectDirect: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/projects/${id}/pause/direct`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
        { type: 'Tasks', id: 'LIST' },
        { type: 'PauseHistory', id },
      ],
    }),

    approvePauseRequest: builder.mutation({
      query: (requestId) => ({
        url: `/projects/pause-requests/${requestId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, requestId) => [
        { type: 'PauseHistory', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
        { type: 'Tasks', id: 'LIST' },
      ],
    }),

    rejectPauseRequest: builder.mutation({
      query: ({ requestId, feedback }) => ({
        url: `/projects/pause-requests/${requestId}/reject`,
        method: 'POST',
        body: { feedback },
      }),
      invalidatesTags: [
        { type: 'PauseHistory', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /** Làm tiếp — hủy đồng hồ 37 ngày, khôi phục task. */
    resumeProject: builder.mutation({
      query: ({ id, resumeReason }) => ({
        url: `/projects/${id}/resume`,
        method: 'POST',
        body: { resumeReason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
        { type: 'Tasks', id: 'LIST' },
        { type: 'PauseHistory', id },
      ],
    }),

    /** Xem trước khi đóng: số task ACCEPTED/CANCELLED, Vinicoin, nợ sẽ khóa. */
    getHoldSummary: builder.query({
      query: (id) => `/projects/${id}/hold-summary`,
      providesTags: (result, error, id) => [{ type: 'Projects', id }],
    }),

    /** BD/BOD/ADMIN đóng dự án TRỰC TIẾP — reason BẮT BUỘC. */
    closeProjectDirect: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/projects/${id}/close/direct`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Debts', id: 'LIST' },
        { type: 'PauseHistory', id },
      ],
    }),

    /** PM đề nghị đóng → chờ BOD duyệt. */
    requestCloseProject: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/projects/${id}/close`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Projects', id },
        { type: 'PauseHistory', id },
      ],
    }),

    approveCloseRequest: builder.mutation({
      query: (requestId) => ({
        url: `/projects/close-requests/${requestId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'PauseHistory', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Debts', id: 'LIST' },
      ],
    }),

    rejectCloseRequest: builder.mutation({
      query: ({ requestId, feedback }) => ({
        url: `/projects/close-requests/${requestId}/reject`,
        method: 'POST',
        body: { feedback },
      }),
      invalidatesTags: [
        { type: 'PauseHistory', id: 'LIST' },
        { type: 'Projects', id: 'LIST' },
      ],
    }),

    /** Lịch sử tạm dừng / đóng dự án. */
    getPauseHistory: builder.query({
      query: (id) => `/projects/${id}/pause-history`,
      providesTags: (result, error, id) => [{ type: 'PauseHistory', id }],
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
  useUpdateProjectWorkingFilesMutation,
  useUpdateProjectProgressMutation,
  useAssignProjectMutation,
  useConfirmProjectMutation,
  // useRetryProjectGoogleSheetMutation,
  useSyncProjectServiceJobsMutation,
  useGetMonthlyWorkTemplateQuery,
  useCreateMonthlyWorkAddendumMutation,
  useCreateProjectServiceAddendumMutation,
  useGetProjectProductDescriptionsQuery,
  useCreateProjectProductDescriptionMutation,
  useUpdateProjectProductDescriptionMutation,
  useSubmitProjectProductDescriptionMutation,
  useApproveProjectProductDescriptionMutation,
  useRejectProjectProductDescriptionMutation,
  useGetMyProjectsQuery,
  useRequestProjectStaffingMutation,
  // Tạm dừng dự án
  useRequestPauseProjectMutation,
  usePauseProjectDirectMutation,
  useApprovePauseRequestMutation,
  useRejectPauseRequestMutation,
  useResumeProjectMutation,
  useGetHoldSummaryQuery,
  useCloseProjectDirectMutation,
  useRequestCloseProjectMutation,
  useApproveCloseRequestMutation,
  useRejectCloseRequestMutation,
  useGetPauseHistoryQuery,
} = projectsApi;
