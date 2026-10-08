import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAuthLoading, selectCurrentUser, selectSessionExpired } from '../../store/authSlice';
import { useGetMeQuery } from '../../api/auth';
import { ForbiddenPage } from '../../pages/Auth/ForbiddenPage';

import { ROUTE_PERMISSIONS } from '../../config/routes.config';
import { hasRole, matchRouteRoles } from '../../hooks/usePermission';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);
  const reduxUser = useSelector(selectCurrentUser);
  const sessionExpired = useSelector(selectSessionExpired);
  const { data: queryUser, isLoading: queryLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated || sessionExpired,
  });
  const location = useLocation();

  const isLoading = authLoading || (isAuthenticated && queryLoading && !reduxUser);
  const currentUser = queryUser || reduxUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra phân quyền RBAC: ưu tiên allowedRoles truyền trực tiếp, nếu không tự động dò từ ROUTE_PERMISSIONS
  const requiredRoles = allowedRoles || matchRouteRoles(location.pathname, ROUTE_PERMISSIONS);
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = currentUser?.role;
    if (!hasRole(userRole, requiredRoles)) {
      return <ForbiddenPage currentRole={userRole} />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
