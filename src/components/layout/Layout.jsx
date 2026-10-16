import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSSE } from '../../hooks/useSSE';
import { useGetMeQuery } from '../../api/auth';
import { useChatStore } from '../../store/useChatStore';
import { requestDesktopNotificationPermission } from '../../utils/chatNotificationSound';

export const Layout = ({ children }) => {
  useSSE();
  const { data: me } = useGetMeQuery();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');

  useEffect(() => {
    if (me?.id) {
      const { initSocket, fetchRooms } = useChatStore.getState();
      initSocket(null, me.id);
      fetchRooms();

      // Tự động yêu cầu quyền thông báo trình duyệt nếu chưa được cấp
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        const handleUserInteract = () => {
          requestDesktopNotificationPermission();
          window.removeEventListener("click", handleUserInteract);
        };
        window.addEventListener("click", handleUserInteract, { once: true });
      }
    }
  }, [me?.id]);

  return (
    <div className={`bg-gray-50 ${isChatPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Header isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className={`${isSidebarCollapsed ? 'pl-20' : 'pl-64'} pt-16 transition-all duration-300 ease-in-out ${isChatPage ? 'h-screen flex flex-col overflow-hidden' : ''}`}>
        <main className={isChatPage ? 'flex-1 h-[calc(100vh-64px)] p-0 overflow-hidden' : 'p-8 pt-0'}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
