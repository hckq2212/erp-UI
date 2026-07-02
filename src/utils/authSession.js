import { getCompanySlugFromPath } from './tenant';

const sessionKey = () => `auth-session:${getCompanySlugFromPath()}`;

export const hasSessionMarker = () => localStorage.getItem(sessionKey()) === 'active';
export const markSessionActive = () => localStorage.setItem(sessionKey(), 'active');
export const clearSessionMarker = () => localStorage.removeItem(sessionKey());
