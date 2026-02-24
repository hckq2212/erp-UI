import { Bell, Check, Clock, Search, Filter, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useGetMyNotificationsQuery, useMarkAsReadMutation } from '../../api/notifications';
import { formatDate } from '../../utils/format';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: notifications = [], isLoading, error } = useGetMyNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();

  const handleMarkAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await markAsRead(notification.id).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await handleMarkAsRead(notification);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = useMemo(() => {
    let result = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filter === 'UNREAD') {
      result = result.filter(n => !n.isRead);
    } else if (filter === 'READ') {
      result = result.filter(n => n.isRead);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(n =>
        n.title?.toLowerCase().includes(lowerSearch) ||
        n.content?.toLowerCase().includes(lowerSearch)
      );
    }

    return result;
  }, [notifications, filter, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotifications, currentPage]);

  // Reset to page 1 when filter/search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <div className="text-gray-400 font-bold uppercase text-xs tracking-widest">Đang tải thông báo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold uppercase text-sm border border-red-100 shadow-sm">
          Không thể tải thông báo
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50/30">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Thông báo</h1>
            <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-wide">
              {notifications.filter(n => !n.isRead).length} tin nhắn chưa đọc
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'UNREAD', 'READ'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === f
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {f === 'ALL' ? 'Tất cả' : f === 'UNREAD' ? 'Chưa đọc' : 'Đã đọc'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm thông báo theo tiêu đề, nội dung..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <AnimatePresence mode="wait">
            {paginatedNotifications.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-16 text-center"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Inbox className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-black uppercase text-sm">Không tìm thấy thông báo</h3>
                <p className="text-gray-400 text-xs font-bold mt-1">Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-gray-50"
              >
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 transition-all relative group hover:bg-gray-50/80 ${!notification.isRead ? 'bg-blue-50/30' : ''
                      }`}
                  >
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className="flex items-start justify-between cursor-pointer gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-base tracking-tight ${!notification.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-600 text-white uppercase shadow-sm">
                              Mới
                            </span>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed mb-3 ${!notification.isRead ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-black uppercase">
                              {notification.createdAt ? formatDate(notification.createdAt) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification);
                          }}
                          className="p-3 text-gray-300 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 border border-transparent hover:border-blue-100"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-100 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-100 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
