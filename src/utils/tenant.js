const DEFAULT_COMPANY_SLUG = 'getvini';

const legacyRootPaths = new Set([
  '',
  'login',
  'customers',
  'opportunities',
  'services',
  'jobs',
  'contracts',
  'projects',
  'tasks',
  'vendors',
  'finance',
  'referral-partners',
  'teams',
  'notifications',
  'users',
  'me',
  'service-packages',
  'acceptance',
]);

export const getCompanySlugFromPath = () => {
  const firstSegment = window.location.pathname.split('/').filter(Boolean)[0] || '';
  return legacyRootPaths.has(firstSegment) ? DEFAULT_COMPANY_SLUG : firstSegment;
};

export const getTenantBasePath = () => `/${getCompanySlugFromPath()}`;

export const ensureTenantPath = () => {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] || '';

  if (!firstSegment) {
    window.history.replaceState(null, '', `/${DEFAULT_COMPANY_SLUG}`);
    return;
  }

  if (legacyRootPaths.has(firstSegment)) {
    const legacyPath = window.location.pathname === '/' ? '' : window.location.pathname;
    window.history.replaceState(null, '', `/${DEFAULT_COMPANY_SLUG}${legacyPath}`);
  }
};
