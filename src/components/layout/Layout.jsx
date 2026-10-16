import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSSE } from '../../hooks/useSSE';

export const Layout = ({ children }) => {
  useSSE(); // Initialize real-time notifications
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');

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
