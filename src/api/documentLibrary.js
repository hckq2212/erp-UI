import { api } from '../store/api';

export const documentLibraryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query({
      query: (params) => ({
        url: '/document-library',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Documents', id })),
              { type: 'Documents', id: 'LIST' },
            ]
          : [{ type: 'Documents', id: 'LIST' }],
    }),
    getDocumentTags: builder.query({
      query: () => '/document-library/tags',
      providesTags: [{ type: 'Documents', id: 'TAGS' }],
    }),
    getDocument: builder.query({
      query: (id) => `/document-library/${id}`,
      providesTags: (result, error, id) => [{ type: 'Documents', id }],
    }),
    uploadDocument: builder.mutation({
      query: (formData) => ({
        url: '/document-library/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Documents', id: 'LIST' }, { type: 'Documents', id: 'TAGS' }],
    }),
    updateDocument: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/document-library/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Documents', id },
        { type: 'Documents', id: 'LIST' },
        { type: 'Documents', id: 'TAGS' },
      ],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/document-library/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Documents', id: 'LIST' }],
    }),
    downloadDocument: builder.mutation({
      query: (id) => ({
        url: `/document-library/${id}/download`,
      }),
    }),
    uploadDocumentVersion: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/document-library/${id}/versions`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Documents', id },
        { type: 'Documents', id: 'LIST' },
        { type: 'DocumentVersions', id },
      ],
    }),
    getDocumentVersions: builder.query({
      query: (id) => `/document-library/${id}/versions`,
      providesTags: (result, error, id) => [{ type: 'DocumentVersions', id }],
    }),
    downloadDocumentVersion: builder.mutation({
      query: ({ id, versionId }) => ({
        url: `/document-library/${id}/versions/${versionId}/download`,
      }),
    }),
    restoreDocumentVersion: builder.mutation({
      query: ({ id, versionId }) => ({
        url: `/document-library/${id}/versions/${versionId}/restore`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Documents', id },
        { type: 'Documents', id: 'LIST' },
        { type: 'DocumentVersions', id },
      ],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentTagsQuery,
  useGetDocumentQuery,
  useUploadDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  useUploadDocumentVersionMutation,
  useGetDocumentVersionsQuery,
  useDownloadDocumentVersionMutation,
  useRestoreDocumentVersionMutation,
} = documentLibraryApi;
