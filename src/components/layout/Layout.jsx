import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout = ({ children }) => {
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
