import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSSE } from '../../hooks/useSSE';

export const Layout = ({ children }) => {
  useSSE(); // Initialize real-time notifications
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className={`${isSidebarCollapsed ? 'pl-20' : 'pl-64'} pt-16 transition-all duration-300 ease-in-out`}>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
