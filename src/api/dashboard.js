import { api } from '../store/api';

export const dashboardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardData: builder.query({
            query: () => '/dashboard',
            providesTags: ['Dashboard'],
        }),
    }),
});

export const { useGetDashboardDataQuery } = dashboardApi;
