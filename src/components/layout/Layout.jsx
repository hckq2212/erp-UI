import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSSE } from '../../hooks/useSSE';

export const Layout = ({ children }) => {
  useSSE(); // Initialize real-time notifications
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <div className="pl-64 pt-16 transition-all duration-300">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
