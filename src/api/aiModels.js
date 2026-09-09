import { api } from '../store/api';

export const aiModelsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiModels: builder.query({
      query: (params) => ({ url: '/ai-models', params }),
      transformResponse: (response) =>
        Array.isArray(response) ? response : response?.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AiModels', id })),
              { type: 'AiModels', id: 'LIST' },
            ]
          : [{ type: 'AiModels', id: 'LIST' }],
    }),
  }),
});

export const { useGetAiModelsQuery } = aiModelsApi;