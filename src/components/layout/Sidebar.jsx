import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileText,
  FileSignature, Rocket, CheckSquare, DollarSign, Settings, Store,
  CheckCircle2, Package, User, Handshake, FolderOpenDotIcon
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useGetMeQuery } from '../../api/auth';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/opportunities', icon: Briefcase, label: 'Cơ Hội', roles: ['ADMIN', 'BOD', 'BD', 'ACCOUNTANT'] },
  { path: '/contracts', icon: FileSignature, label: 'Hợp Đồng', roles: ['ADMIN', 'BOD', 'BD', 'ACCOUNTANT'] },
  { path: '/customers', icon: Users, label: 'Khách Hàng', roles: ['ADMIN', 'BOD', 'BD'] },
  { path: '/projects', icon: FolderOpenDotIcon, label: 'Dự Án' },
  { path: '/tasks', icon: CheckSquare, label: 'Công Việc' },
  { path: '/acceptance', icon: CheckCircle2, label: 'Nghiệm thu', roles: ['ADMIN', 'BOD'] },
  { path: '/finance', icon: DollarSign, label: 'Lộ trình thanh toán', roles: ['ADMIN', 'BOD', 'BD', 'ACCOUNTANT'] },
  { path: '/service-packages', icon: Package, label: 'Gói dịch vụ', roles: ['ADMIN', 'BOD', 'BD'] },
  { path: '/services', icon: Briefcase, label: 'Dịch vụ', roles: ['ADMIN', 'BOD', 'BD'] },
  { path: '/jobs', icon: CheckSquare, label: 'Hạng mục công việc', roles: ['ADMIN', 'BOD', 'BD'] },
  { path: '/teams', icon: Users, label: 'Đội dự án', roles: ['ADMIN', 'BOD', 'BD'] },
  { path: '/users', icon: User, label: 'Nhân sự', roles: ['ADMIN', 'BOD', 'ACCOUNTANT'] },
  { path: '/vendors', icon: Store, label: 'Vendor', roles: ['ADMIN', 'BOD', 'ACCOUNTANT'] },
  { path: '/referral-partners', icon: Handshake, label: 'Đối tác', roles: ['ADMIN', 'BOD', 'BD'] },

];

export const Sidebar = ({ isCollapsed }) => {
  const location = useLocation();
  const { data: me } = useGetMeQuery();

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(me?.role);
  });

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto z-20 transition-all duration-300 ease-in-out scrollbar-hide",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <nav className="p-3 space-y-1.5">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center px-3 py-3 text-sm font-bold rounded-xl transition-all group relative',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600',
                isCollapsed ? 'justify-center' : ''
              )}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className={cn(
                'h-5 w-5 transition-all shrink-0',
                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500',
                isCollapsed ? 'mr-0' : 'mr-3'
              )} />
              {!isCollapsed && (
                <span className="truncate transition-opacity duration-300 opacity-100">
                  {item.label}
                </span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
