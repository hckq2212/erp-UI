import { api } from '../store/api';

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /notifications/me - Lấy thông báo của người dùng hiện tại
    getMyNotifications: builder.query({
      query: () => '/notifications/me',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Notifications', id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),

    // PUT /notifications/:id/read - Đánh dấu đã đọc
    markAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, notificationId) => [
        { type: 'Notifications', id: notificationId },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
} = notificationsApi;
