const SESSION_KEY = 'auth-session';

export const hasSessionMarker = () => localStorage.getItem(SESSION_KEY) === 'active';
export const markSessionActive = () => localStorage.setItem(SESSION_KEY, 'active');
export const clearSessionMarker = () => localStorage.removeItem(SESSION_KEY);
