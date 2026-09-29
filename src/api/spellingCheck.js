import { api } from '../store/api';

export const spellingCheckApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSpellCheckSheets: builder.mutation({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/spelling-check/sheets',
          method: 'POST',
          body: formData,
        };
      },
    }),
    listSpellCheckSheetsFromUrl: builder.mutation({
      query: ({ fileUrl, fileName }) => ({
        url: '/spelling-check/sheets-from-url',
        method: 'POST',
        body: { fileUrl, fileName },
      }),
    }),
    previewSheetFromUrl: builder.mutation({
      query: (body) => ({
        url: '/spelling-check/preview-from-url',
        method: 'POST',
        body,
      }),
    }),
    startSpellCheck: builder.mutation({
      query: ({ file, lang, sheetNames, whitelist, scenarioIds }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('lang', lang || 'both');
        if (sheetNames?.length) formData.append('sheetNames', sheetNames.join(','));
        if (whitelist?.length) formData.append('whitelist', whitelist.join(','));
        if (scenarioIds?.length) formData.append('scenarioIds', scenarioIds.join(','));
        return {
          url: '/spelling-check/start',
          method: 'POST',
          body: formData,
        };
      },
    }),
    startSpellCheckFromUrl: builder.mutation({
      query: ({ fileUrl, fileName, lang, sheetNames, whitelist, scenarioIds }) => ({
        url: '/spelling-check/start-from-url',
        method: 'POST',
        body: {
          fileUrl,
          fileName,
          lang: lang || 'both',
          sheetNames: sheetNames?.length ? sheetNames.join(',') : undefined,
          whitelist: whitelist?.length ? whitelist.join(',') : undefined,
          scenarioIds: scenarioIds?.length ? scenarioIds.join(',') : undefined,
        },
      }),
    }),
    getSpellCheckStatus: builder.query({
      query: (jobId) => `/spelling-check/${jobId}`,
    }),
    deleteSpellCheckJob: builder.mutation({
      query: (jobId) => ({
        url: `/spelling-check/${jobId}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useListSpellCheckSheetsMutation,
  useListSpellCheckSheetsFromUrlMutation,
  usePreviewSheetFromUrlMutation,
  useStartSpellCheckMutation,
  useStartSpellCheckFromUrlMutation,
  useGetSpellCheckStatusQuery,
  useDeleteSpellCheckJobMutation,
} = spellingCheckApi;
