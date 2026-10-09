import { api } from '../store/api';

export const dashboardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardData: builder.query({
            query: ({ userId, month, year, projectId, mode, startMonth, endMonth } = {}) => {
                let url = '/dashboard';
                const params = new URLSearchParams();
                if (userId) params.append('userId', userId);
                if (month) params.append('month', month);
                if (startMonth) params.append('startMonth', startMonth);
                if (endMonth) params.append('endMonth', endMonth);
                if (year) params.append('year', year);
                if (projectId) params.append('projectId', projectId);
                if (mode) params.append('mode', mode);
                const queryString = params.toString();
                return queryString ? `${url}?${queryString}` : url;
            },
            providesTags: ['Dashboard'],
        }),
    }),
});

export const { useGetDashboardDataQuery } = dashboardApi;
