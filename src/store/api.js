import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// const BASE_URL = 'http://localhost:3000/api';
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Check if this is an authentication-related request
  const url = typeof args === 'string' ? args : args.url;
  const isAuthRequest = url && (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout'));

  let result = await baseQuery(args, api, extraOptions);

  // If 401 and NOT an auth request, try to refresh
  // if (result.error && result.error.status === 401 && !isAuthRequest) {
  //   const refreshResult = await baseQuery(
  //     { url: '/auth/refresh', method: 'POST' },
  //     api,
  //     extraOptions
  //   );

  //   if (refreshResult.data) {
  //     // Retry original request
  //     result = await baseQuery(args, api, extraOptions);
  //   } else {
  //     // Both failed - logout
  //     api.dispatch({ type: 'auth/logout' });
  //   }
  // }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth', 'Opportunities', 'Services', 'Jobs', 'Contracts',
    'Quotations', 'PaymentMilestones', 'Projects', 'Tasks',
    'Users', 'Customers', 'Teams', 'Notifications',
    'ReferralPartners', 'Vendors', 'Debts', 'JobCriterias', 'TaskReviews',
    'ContractAddendums',
  ],
  endpoints: () => ({}),
});
