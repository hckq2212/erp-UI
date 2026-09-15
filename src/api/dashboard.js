import { api } from '../store/api';

export const dashboardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardData: builder.query({
            query: ({ userId, month, year, projectId } = {}) => {
                let url = '/dashboard';
                const params = new URLSearchParams();
                if (userId) params.append('userId', userId);
                if (month) params.append('month', month);
                if (year) params.append('year', year);
                if (projectId) params.append('projectId', projectId);
                const queryString = params.toString();
                return queryString ? `${url}?${queryString}` : url;
            },
            providesTags: ['Dashboard'],
        }),
    }),
});

export const { useGetDashboardDataQuery } = dashboardApi;
