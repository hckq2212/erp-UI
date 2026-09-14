import { api } from '../store/api';

export const elementsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getElementsHistory: builder.query({
      query: () => '/elements/history',
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: 'Elements', id })),
              { type: 'Elements', id: 'LIST' },
            ]
          : [{ type: 'Elements', id: 'LIST' }],
    }),
    createElement: builder.mutation({
      query: (formData) => ({
        url: '/elements/create',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Elements', id: 'LIST' }],
    }),
    deleteElement: builder.mutation({
      query: (elementId) => ({
        url: `/elements/${elementId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, elementId) => [
        { type: 'Elements', id: elementId },
        { type: 'Elements', id: 'LIST' },
      ],
    }),
    setElementFavorite: builder.mutation({
      query: ({ elementId, isFavorite }) => ({
        url: `/elements/${elementId}/favorite`,
        method: 'PATCH',
        body: { isFavorite },
      }),
      invalidatesTags: (result, error, { elementId }) => [
        { type: 'Elements', id: elementId },
        { type: 'Elements', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetElementsHistoryQuery,
  useCreateElementMutation,
  useDeleteElementMutation,
  useSetElementFavoriteMutation,
} = elementsApi;