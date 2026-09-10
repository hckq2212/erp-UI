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
      query: ({ file, fileUrl, fileName, sheetNames, projectId }) => {
        const formData = new FormData();
        if (file) formData.append('file', file);
        if (fileUrl) formData.append('fileUrl', fileUrl);
        if (fileName) formData.append('fileName', fileName);
        formData.append('sheetNames', (sheetNames || []).join(','));
        formData.append('projectId', projectId);
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
