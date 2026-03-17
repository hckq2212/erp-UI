import { api } from '../store/api';

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: '/chat',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useSendMessageMutation,
} = chatApi;
