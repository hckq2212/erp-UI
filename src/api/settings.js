import { api } from '../store/api';

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getQcSettings: builder.query({
      query: () => '/settings/qc',
      providesTags: [{ type: 'Settings', id: 'QC' }],
    }),
    updateQcSettings: builder.mutation({
      query: (body) => ({
        url: '/settings/qc',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Settings', id: 'QC' }],
    }),
  }),
});

export const {
  useGetQcSettingsQuery,
  useUpdateQcSettingsMutation,
} = settingsApi;
