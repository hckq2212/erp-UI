import { Bell, Search, User, LogOut, Check, Clock, ChevronRight, Menu } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectCurrentUser, logout as logoutAction } from '../../store/authSlice';
import { useGetMyNotificationsQuery, useMarkAsReadMutation } from '../../api/notifications';
import { useLogoutMutation } from '../../api/auth';
import { formatDate } from '../../utils/format';
import logo from '../../assets/logo.png';
import { clearSessionMarker } from '../../utils/authSession';

export const Header = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifications = [] } = useGetMyNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [logoutApi] = useLogoutMutation();

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [notifications]);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      clearSessionMarker();
      dispatch(logoutAction());
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      clearSessionMarker();
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markAsRead(id).unwrap();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n.id).unwrap();
    }
    setShowNotifications(false);
    navigate(n.link || '/notifications');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between  px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2.5 rounded-xl text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
          title={isSidebarCollapsed ? "Mở danh mục" : "Thu gọn danh mục"}
        >
          <Menu className="h-6 w-6" />
        </button>
        {/* <Link to="/" className="flex items-center">
          <img
            alt="Office Logo"
            className="h-10 w-auto object-contain cursor-pointer"
            src={logo}
          />
        </Link> */}
      </div>

      <div className="flex items-center space-x-4">
        <div
          className="relative"
          onMouseEnter={() => setShowNotifications(true)}
          onMouseLeave={() => setShowNotifications(false)}
        >
          <button
            onClick={() => {
              setShowNotifications(false);
              navigate('/notifications');
            }}
            className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'}`}
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center h-4 w-4 text-[10px] font-black text-white bg-red-500 rounded-full ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 mt-1 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase">Thông báo mới</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} Mới
                    </span>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-all cursor-pointer relative group ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'} truncate`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed whitespace-pre-line">
                              {n.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-400 font-bold uppercase">
                                {formatDate(n.createdAt)}
                              </span>
                            </div>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, n.id)}
                              className="self-start p-1.5 text-gray-300 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">Chưa có thông báo nào</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="w-full p-3 text-xs font-black text-blue-600 hover:bg-blue-50 transition-all border-t border-gray-50 flex items-center justify-center gap-1 uppercase"
                >
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-3 pl-1 pr-3 py-1 rounded-xl">
          <button
            className="flex items-center space-x-2"
            onClick={() => navigate(`/me`)}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-black text-gray-900 leading-none">{user?.fullName || user?.username || 'User'}</span>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-[6px] font-black text-white">V</span>
                </div>
                <span
                  className="text-[10px] font-black text-amber-600 leading-none"
                  title={`Tổng tích lũy: ${user?.vinicoinTotal?.toLocaleString() || 0} Vinicoin`}
                >
                  {user?.vinicoin?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </button>
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
