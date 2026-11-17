import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearSessionMarker, hasSessionMarker, markSessionActive } from '../utils/authSession';
import { generateIdempotencyKey } from '../utils/idempotency';

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

// Cache Idempotency-Key cho các mutation đang chờ hoặc bị lỗi mạng để tái sử dụng đúng key khi retry
const pendingMutationKeys = new Map();
const RETRY_KEY_TTL_MS = 5 * 60 * 1000; // 5 phút

const computeBufferHash = async (buffer) => {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}
  const bytes = new Uint8Array(buffer);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h = Math.imul(h ^ bytes[i], 0x01000193);
  }
  return (h >>> 0).toString(16);
};

const serializeRequestPayload = async (body) => {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const parts = [];
    const promises = [];
    if (typeof body.forEach === 'function') {
      body.forEach((value, key) => {
        if (value && typeof value === 'object') {
          const fileMeta = `${value.name || ''}:${value.size || 0}:${value.type || ''}:${value.lastModified || 0}`;
          if (typeof value.arrayBuffer === 'function') {
            promises.push(
              value.arrayBuffer().then(async (buf) => {
                const hash = await computeBufferHash(buf);
                parts.push(`${key}=${fileMeta}:${hash}`);
              }).catch(() => {
                parts.push(`${key}=${fileMeta}`);
              })
            );
          } else if (typeof value.text === 'function') {
            promises.push(
              value.text().then((txt) => {
                parts.push(`${key}=${fileMeta}:${txt}`);
              }).catch(() => {
                parts.push(`${key}=${fileMeta}`);
              })
            );
          } else {
            parts.push(`${key}=${fileMeta}`);
          }
        } else {
          parts.push(`${key}=${String(value)}`);
        }
      });
    }
    await Promise.all(promises);
    return `FormData[${parts.sort().join(';')}]`;
  }
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
};

const cleanupExpiredKeys = () => {
  const now = Date.now();
  for (const [sig, item] of pendingMutationKeys.entries()) {
    if (now - item.timestamp > RETRY_KEY_TTL_MS) {
      pendingMutationKeys.delete(sig);
    }
  }
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Check if this is an authentication-related request
  const url = typeof args === 'string' ? args : args.url;
  const method = (typeof args === 'string' ? 'GET' : (args.method || 'GET')).toUpperCase();
  const isAuthRequest = url && (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout'));

  // Tự động gắn Idempotency-Key cho mutation (POST/PUT/PATCH/DELETE) và giữ nguyên key khi retry lỗi mạng
  let reqSig = null;
  if (!isAuthRequest && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && typeof args === 'object') {
    args.headers = args.headers || {};
    if (!args.headers['Idempotency-Key']) {
      try {
        reqSig = `${method}:${url}:${await serializeRequestPayload(args.body)}`;
        cleanupExpiredKeys();
        const existing = pendingMutationKeys.get(reqSig);
        if (existing && (Date.now() - existing.timestamp < RETRY_KEY_TTL_MS)) {
          args.headers['Idempotency-Key'] = existing.key;
        } else {
          const newKey = generateIdempotencyKey();
          pendingMutationKeys.set(reqSig, { key: newKey, timestamp: Date.now() });
          args.headers['Idempotency-Key'] = newKey;
        }
      } catch {
        args.headers['Idempotency-Key'] = generateIdempotencyKey();
      }
    }
  }

  let result = await baseQuery(args, api, extraOptions);

  // Khi request thành công (2xx), xóa key khỏi retry cache để lần submit tiếp theo sinh key mới
  if (!result.error && reqSig) {
    pendingMutationKeys.delete(reqSig);
  }

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
