import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSSE } from '../../hooks/useSSE';

export const Layout = ({ children }) => {
  useSSE(); // Initialize real-time notifications
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Header isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className={`${isSidebarCollapsed ? 'pl-20' : 'pl-64'} pt-16 transition-all duration-300 ease-in-out`}>
        <main className={isChatPage ? "p-0 h-[calc(100vh-64px)] overflow-hidden" : "p-8 pr-4 pt-0"}>
          {children}
        </main>
      </div>
    </div>
  );
};

