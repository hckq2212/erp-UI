import { Bell, Search, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../store/authSlice';
import { useGetMyNotificationsQuery } from '../../api/notifications';

export const Header = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: notifications = [] } = useGetMyNotificationsQuery();
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
      <div className="flex items-center">
        <span className="text-xl font-bold text-blue-600">GETVINI</span>
      </div>
      
      <div className="flex-1 max-w-lg mx-8">
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
        </div>

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
        <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-700">{user?.fullName || 'User'}</span>
        </div>
      </div>
    </header>
  );
};
