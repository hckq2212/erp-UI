import { api } from '../store/api';

export const videoGenerationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createVideoGeneration: builder.mutation({
      // formData được build sẵn ở hook, ở đây chỉ forward
      query: (formData) => ({
        url: '/video-generations/create',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, formData) => [
        { type: 'VideoGenerations', id: 'LIST' },
        { type: 'VideoGenerations', id: `BUDGET-${formData.get('taskId')}` },
      ],
    }),
    getVideoGenerationStatus: builder.query({
      query: (id) => `/video-generations/${id}/status`,
      providesTags: (result, error, id) => [{ type: 'VideoGenerations', id }],
    }),
    getVideoGenHistory: builder.query({
      query: () => '/video-generations/history',
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: 'VideoGenerations', id })),
              { type: 'VideoGenerations', id: 'LIST' },
            ]
          : [{ type: 'VideoGenerations', id: 'LIST' }],
    }),
    getGenerationBudget: builder.query({
      query: (taskId) => `/video-generations/tasks/${taskId}/budget`,
      providesTags: (result, error, taskId) => [
        { type: 'VideoGenerations', id: `BUDGET-${taskId}` },
      ],
    }),
    createMotionControlVideo: builder.mutation({
      query: (formData) => ({
        url: '/video-generations/create-motion-control',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, formData) => [
        { type: 'VideoGenerations', id: 'LIST' },
        { type: 'VideoGenerations', id: `BUDGET-${formData.get('taskId')}` },
      ],
    }),
    getMotionControlHistory: builder.query({
      query: () => '/video-generations/motion-control/history',
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: 'VideoGenerations', id })),
              { type: 'VideoGenerations', id: 'LIST' },
            ]
          : [{ type: 'VideoGenerations', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateVideoGenerationMutation,
  useCreateMotionControlVideoMutation,
  useGetMotionControlHistoryQuery,
  useGetVideoGenerationStatusQuery,
  useGetVideoGenHistoryQuery,
  useGetGenerationBudgetQuery,
} = videoGenerationsApi;
