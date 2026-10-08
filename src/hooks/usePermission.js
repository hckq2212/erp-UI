import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { matchPath } from 'react-router-dom';
import { selectCurrentUser } from '../store/authSlice';

/**
 * Pure evaluation function for RBAC role check
 * @param {string} userRole - Current user role
 * @param {string[]|null|undefined} allowedRoles - Allowed roles list
 * @returns {boolean}
 */
export const hasRole = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

/**
 * Match current pathname against route permission matrix with support for dynamic params (:id)
 * @param {string} pathname - Current location pathname
 * @param {Record<string, string[]>} permissionsMap - ROUTE_PERMISSIONS mapping
 * @returns {string[] | null} Allowed roles or null if not restricted
 */
export const matchRouteRoles = (pathname, permissionsMap) => {
  if (!pathname || !permissionsMap) return null;

  // Direct exact match
  if (permissionsMap[pathname]) {
    return permissionsMap[pathname];
  }

  // Dynamic pattern match (e.g. /customers/:id matches /customers/123)
  for (const [pattern, roles] of Object.entries(permissionsMap)) {
    if (pattern.includes(':')) {
      const match = matchPath({ path: pattern, end: true }, pathname);
      if (match) {
        return roles;
      }
    }
  }

  return null;
};

/**
 * Hook to check role-based permissions in React components
 * @param {string[]|null|undefined} allowedRoles - Required roles list
 * @returns {{ hasPermission: boolean, userRole: string|null, isAdmin: boolean, isAllowed: (roles: string[]) => boolean }}
 */
export const usePermission = (allowedRoles) => {
  const currentUser = useSelector(selectCurrentUser);
  const userRole = currentUser?.role || null;

  const hasPermission = useMemo(() => {
    return hasRole(userRole, allowedRoles);
  }, [userRole, allowedRoles]);

  const isAdmin = userRole === 'ADMIN';

  const isAllowed = useMemo(() => {
    return (roles) => hasRole(userRole, roles);
  }, [userRole]);

  return {
    hasPermission,
    userRole,
    isAdmin,
    isAllowed,
  };
};

export default usePermission;
