import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearSessionMarker, hasSessionMarker, markSessionActive } from '../utils/authSession';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const hasApiSuffix = /\/api(\/v\d+)?$/.test(configuredApiUrl);

export const BASE_URL = configuredApiUrl
  ? (hasApiSuffix ? configuredApiUrl : `${configuredApiUrl}/api`)
  : '/api';

const runtimeOrigin = globalThis.location?.origin || 'http://localhost:5173';

export const API_ORIGIN = configuredApiUrl
  ? new URL(BASE_URL, runtimeOrigin).origin
  : (import.meta.env.DEV ? 'http://localhost:3000' : runtimeOrigin);

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
      const executeWithLock = async () => {
        if (!globalThis.navigator?.locks) {
          return refreshUnderLock();
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort('auth-refresh-timeout'), 10000);

        try {
          return await globalThis.navigator.locks.request(
            lockName,
            { signal: controller.signal },
            refreshUnderLock
          );
        } catch (lockErr) {
          console.warn('[auth] navigator.locks aborted or failed, falling back to direct refresh:', lockErr);
          return refreshUnderLock();
        } finally {
          clearTimeout(timer);
        }
      };

      refreshPromise = executeWithLock().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshOutcome = await refreshPromise;
    if (refreshOutcome?.refreshed) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      const refreshError = refreshOutcome?.refreshResult?.error;
      if (refreshError?.status === 401 || refreshError?.status === 403) {
        clearSessionMarker();
        api.dispatch({ type: 'auth/sessionExpired' });
      } else if (refreshError) {
        // Preserve the session for transient network and server failures.
        result = refreshOutcome.refreshResult;
      }
    }
  }

  // 🛡️ BỘ CHUYỂN ĐỔI THÔNG MINH (SMART UNWRAPPER): Tự động bóc vỏ { success: true, data: ... }
  if (result.data && typeof result.data === 'object' && result.data.success === true && 'data' in result.data) {
    if (result.data.meta && Array.isArray(result.data.data)) {
      result.data = {
        data: result.data.data,
        total: result.data.meta.total,
        page: result.data.meta.page,
        limit: result.data.meta.limit,
      };
    } else {
      result.data = result.data.data;
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
    'ReferralPartners', 'Vendors', 'Debts', 'PaymentRequests', 'JobCriterias', 'TaskReviews',
    'ContractAddendums', 'Dashboard', 'Acceptance', 'ServicePackages', 'Chat',
    'ProjectProductDescriptions', 'TaskResultChecks',
    'ProjectProductDescriptions', 'ProjectSpellCheckWhitelist',
    'VideoGenerations', 'AiModels', 'Assets', 'Elements',
    'Documents', 'DocumentVersions', 'Announcements', 'AnnouncementComments',
    'Settings', 'PauseHistory', 'PaymentDashboard', 'FinanceDocuments'
  ],
  endpoints: () => ({}),
});
