import { Bell, Check, Clock } from 'lucide-react';
import { useGetMyNotificationsQuery, useMarkAsReadMutation } from '../../api/notifications';
import { formatDate } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading, error } = useGetMyNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải thông báo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Không thể tải thông báo</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">
              {notifications.filter(n => !n.isRead).length} chưa đọc
            </span>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                    }`}
                >
                  <div
                    onClick={() => navigate(notification.link)}
                    className="flex items-start justify-between cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Mới
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {notification.createdAt
                              ? formatDate(notification.createdAt)
                              : 'N/A'}
                          </span>
                        </div>
                        {notification.type && (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {notification.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="ml-4 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
