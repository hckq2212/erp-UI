import { api } from '../store/api';

export const assetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLibraryAssets: builder.query({
      query: ({ tab = 'creative', type = 'all', favorite = false } = {}) => ({
        url: '/assets',
        params: { tab, type, favorite },
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Assets', id })),
              { type: 'Assets', id: 'LIST' },
            ]
          : [{ type: 'Assets', id: 'LIST' }],
    }),
    uploadAsset: builder.mutation({
      query: (formData) => ({
        url: '/assets/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Assets', id: 'LIST' }],
    }),
    setAssetFavorite: builder.mutation({
      query: ({ assetId, isFavorite }) => ({
        url: `/assets/${assetId}/favorite`,
        method: 'PATCH',
        body: { isFavorite },
      }),
      invalidatesTags: (result, error, { assetId }) => [
        { type: 'Assets', id: assetId },
        { type: 'Assets', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetLibraryAssetsQuery,
  useUploadAssetMutation,
  useSetAssetFavoriteMutation,
} = assetsApi;