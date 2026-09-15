import { api } from '../store/api';

export const qcApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getQcProductInfo: builder.query({
      query: (projectId) => `/qc/product-info/${projectId}`,
    }),
    listQcSheets: builder.mutation({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/qc/sheets',
          method: 'POST',
          body: formData,
        };
      },
    }),
    listQcSheetsFromUrl: builder.mutation({
      query: ({ fileUrl, fileName }) => ({
        url: '/qc/sheets-from-url',
        method: 'POST',
        body: { fileUrl, fileName },
      }),
    }),
    runQc: builder.mutation({
      query: ({ file, fileUrl, fileName, sheetNames, projectId, extractModel, verifyModel }) => {
        const formData = new FormData();
        if (file) formData.append('file', file);
        if (fileUrl) formData.append('fileUrl', fileUrl);
        if (fileName) formData.append('fileName', fileName);
        formData.append('sheetNames', (sheetNames || []).join(','));
        formData.append('projectId', projectId);
        if (extractModel) formData.append('extractModel', extractModel);
        if (verifyModel) formData.append('verifyModel', verifyModel);
        return {
          url: '/qc/run',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetQcProductInfoQuery,
  useListQcSheetsMutation,
  useListQcSheetsFromUrlMutation,
  useRunQcMutation,
} = qcApi;