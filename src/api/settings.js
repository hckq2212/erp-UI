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
    getWorkloadNormSettings: builder.query({
      query: () => '/settings/workload-norms',
      providesTags: [{ type: 'Settings', id: 'WORKLOAD_NORMS' }],
    }),
    updateWorkloadNormSettings: builder.mutation({
      query: (body) => ({
        url: '/settings/workload-norms',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Settings', id: 'WORKLOAD_NORMS' }],
    }),
  }),
});

export const {
  useGetQcSettingsQuery,
  useUpdateQcSettingsMutation,
  useGetWorkloadNormSettingsQuery,
  useUpdateWorkloadNormSettingsMutation,
} = settingsApi;
