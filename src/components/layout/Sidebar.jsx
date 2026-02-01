import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileText,
  FileSignature, Rocket, CheckSquare, DollarSign, Settings, Store
} from 'lucide-react';
import { cn } from '../../utils/cn';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/customers', icon: Users, label: 'Khách Hàng' },
  { path: '/opportunities', icon: Briefcase, label: 'Cơ Hội' },
  { path: '/vendors', icon: Store, label: 'Vendor' },
  { path: '/contracts', icon: FileSignature, label: 'Hợp Đồng' },
  { path: '/projects', icon: Rocket, label: 'Dự Án' },
  { path: '/tasks', icon: CheckSquare, label: 'Công Việc' },
  { path: '/services', icon: Briefcase, label: 'Dịch vụ' },
  { path: '/jobs', icon: CheckSquare, label: 'Hạng mục dịch vụ' },
  { path: '/teams', icon: Users, label: 'Đội dự án' },
  { path: '/referral-partners', icon: Users, label: 'Đối tác' },
  { path: '/finance', icon: DollarSign, label: 'Lộ trình thanh toán' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-20">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('mr-3 h-5 w-5 transition-colors', isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
