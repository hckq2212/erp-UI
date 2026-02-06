import { Bell, Search, User, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser, logout as logoutAction } from '../../store/authSlice';
import { useGetMyNotificationsQuery } from '../../api/notifications';
import { useLogoutMutation } from '../../api/auth';
import logo from '../../assets/logo.png';

export const Header = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: notifications = [] } = useGetMyNotificationsQuery();
  const [logoutApi] = useLogoutMutation();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logoutAction());
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if API fails, clear local state
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
      <div className="flex items-center">
        <img
          alt="Office Logo"
          className="h-15 w-15  object-contain"
          src={logo}
        />
      </div>

      {/* <div className="flex-1 max-w-lg mx-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="Search..."
          />
        </div>
      </div> */}

      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 text-gray-400 hover:text-gray-500 relative"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 text-xs font-medium text-white bg-red-500 rounded-full ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center space-x-3 pl-1 pr-3 py-1 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-900 leading-none">{user?.fullName || user?.username || 'User'}</span>
            </div>
          </div>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
