import { api } from '../store/api';

export const announcementsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query({
      query: (params) => ({
        url: '/announcements',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Announcements', id })),
              { type: 'Announcements', id: 'LIST' },
            ]
          : [{ type: 'Announcements', id: 'LIST' }],
    }),

    getAnnouncement: builder.query({
      query: (id) => `/announcements/${id}`,
      providesTags: (result, error, id) => [{ type: 'Announcements', id }],
    }),

    createAnnouncement: builder.mutation({
      query: (data) => ({
        url: '/announcements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Announcements', id: 'LIST' }, { type: 'Notifications', id: 'LIST' }],
    }),

    updateAnnouncement: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/announcements/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Announcements', id },
        { type: 'Announcements', id: 'LIST' },
      ],
    }),

    deleteAnnouncement: builder.mutation({
      query: (id) => ({
        url: `/announcements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Announcements', id: 'LIST' }],
    }),

    markAnnouncementAsRead: builder.mutation({
      query: (id) => ({
        url: `/announcements/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Announcements', id },
        { type: 'Announcements', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useGetAnnouncementQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useMarkAnnouncementAsReadMutation,
} = announcementsApi;
