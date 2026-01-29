import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
      // Get token from localStorage or state
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'Opportunities',
    'Services',
    'Jobs',
    'Contracts',
    'Quotations',
    'PaymentMilestones',
    'Projects',
    'Tasks',
    'Users',
    'Customers',
    'Teams',
    'Notifications',
  ],
  endpoints: () => ({}),
});
