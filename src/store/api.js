import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearSessionMarker, hasSessionMarker, markSessionActive } from '../utils/authSession';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const BASE_URL = configuredApiUrl
  ? (configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`)
  : '/api';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
});

let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Check if this is an authentication-related request
  const url = typeof args === 'string' ? args : args.url;
  const isAuthRequest = url && (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout'));

  let result = await baseQuery(args, api, extraOptions);

  if (!result.error && url?.includes('/auth/login')) markSessionActive();
  if (!result.error && url === '/me') markSessionActive();
  if (!result.error && url?.includes('/auth/logout')) clearSessionMarker();

  if (result.error?.status === 401 && !isAuthRequest) {
    if (!refreshPromise) {
      const refreshUnderLock = async () => {
        // Another tab may have refreshed while this request waited for the lock.
        const retriedBeforeRefresh = await baseQuery(args, api, extraOptions);
        if (retriedBeforeRefresh.error?.status !== 401) return { refreshed: true };

        const refreshResult = await baseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions
        );
        return { refreshed: !refreshResult.error, refreshResult };
      };

      const lockName = 'auth-refresh';
      refreshPromise = globalThis.navigator?.locks
        ? globalThis.navigator.locks.request(lockName, refreshUnderLock)
        : refreshUnderLock();
      refreshPromise = refreshPromise.finally(() => {
        refreshPromise = null;
      });
    }

    const refreshOutcome = await refreshPromise;
    if (refreshOutcome.refreshed) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      const refreshError = refreshOutcome.refreshResult?.error;
      if (
        refreshError?.status === 401 &&
        refreshError?.data?.code === 'SESSION_EXPIRED' &&
        hasSessionMarker()
      ) {
        api.dispatch({ type: 'auth/sessionExpired' });
      } else if (refreshError) {
        // Preserve the session for transient network and server failures.
        result = refreshOutcome.refreshResult;
      }
    }
  }

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
    'ContractAddendums', 'Dashboard', 'Acceptance', 'ServicePackages', 'Chat',
    'ProjectProductDescriptions', 'TaskResultChecks',
    'ProjectProductDescriptions', 'ProjectSpellCheckWhitelist',
    'VideoGenerations', 'AiModels', 'Assets', 'Elements',
    'Documents', 'DocumentVersions',
  ],
  endpoints: () => ({}),
});
