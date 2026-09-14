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
      invalidatesTags: [{ type: 'VideoGenerations', id: 'LIST' }],
    }),
    getVideoGenerationStatus: builder.query({
      query: (id) => `/video-generations/${id}/status`,
      providesTags: (result, error, id) => [{ type: 'VideoGenerations', id }],
    }),
    getVideoGenHistory: builder.query({
      query: () => '/video-generations/video-gen/history',
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
  useGetVideoGenerationStatusQuery,
  useGetVideoGenHistoryQuery,
} = videoGenerationsApi;