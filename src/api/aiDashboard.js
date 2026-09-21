import { api } from '../store/api';

export const aiDashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiDashboard: builder.query({
      query: ({ userId, projectId, opportunityId, taskId, month, year }) => ({
        url: '/ai-dashboard',
        params: {
          ...(userId && userId !== 'ALL' ? { userId } : {}),
          ...(projectId ? { projectId } : {}),
          ...(opportunityId ? { opportunityId } : {}),
          ...(taskId ? { taskId } : {}),
          month,
          year,
        },
      }),
      providesTags: ['AIDashboard'],
    }),
  }),
});

export const { useGetAiDashboardQuery } = aiDashboardApi;
