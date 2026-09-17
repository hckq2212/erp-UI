import { api } from '../store/api';

export const projectSpellCheckWhitelistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectSpellCheckWhitelist: builder.query({
      query: (projectId) => `/projects/${projectId}/spelling-whitelist`,
      providesTags: (result, error, projectId) => [
        { type: 'ProjectSpellCheckWhitelist', id: projectId },
      ],
    }),
    addProjectSpellCheckWhitelistWord: builder.mutation({
      query: ({ projectId, word }) => ({
        url: `/projects/${projectId}/spelling-whitelist`,
        method: 'POST',
        body: { word },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectSpellCheckWhitelist', id: projectId },
      ],
    }),
    removeProjectSpellCheckWhitelistWord: builder.mutation({
      query: ({ projectId, whitelistId }) => ({
        url: `/projects/${projectId}/spelling-whitelist/${whitelistId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'ProjectSpellCheckWhitelist', id: projectId },
      ],
    }),
  }),
});

export const {
  useGetProjectSpellCheckWhitelistQuery,
  useAddProjectSpellCheckWhitelistWordMutation,
  useRemoveProjectSpellCheckWhitelistWordMutation,
} = projectSpellCheckWhitelistApi;
