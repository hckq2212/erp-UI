import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileText,
  FileSignature, Rocket, CheckSquare, DollarSign, Settings, Store,
  CheckCircle2, Package, User, Handshake, FolderOpenDotIcon , Video, BookText, Megaphone, Bell, Archive
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useGetMeQuery } from '../../api/auth';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/opportunities', icon: Briefcase, label: 'Cơ Hội', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'] },
  { path: '/contracts', icon: FileSignature, label: 'Hợp Đồng', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'] },
  { path: '/customers', icon: Users, label: 'Khách Hàng', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'] },
  { path: '/projects', icon: FolderOpenDotIcon, label: 'Dự Án' },
  { path: '/tasks', icon: CheckSquare, label: 'Công Việc' },
  { path: '/acceptance', icon: CheckCircle2, label: 'Nghiệm thu', roles: ['ADMIN', 'BOD', 'ADMIN_SALE', 'PM'] },
  { path: '/finance', icon: DollarSign, label: 'Lộ trình thanh toán', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'] },
  { path: '/service-packages', icon: Package, label: 'Gói dịch vụ', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'] },
  { path: '/services', icon: Briefcase, label: 'Dịch vụ', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'] },
  { path: '/jobs', icon: CheckSquare, label: 'Hạng mục công việc', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE', 'PM'] },
  { path: '/teams', icon: Users, label: 'Đội dự án', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE', 'PM'] },
  { path: '/users', icon: User, label: 'Nhân sự', roles: ['ADMIN', 'BOD'] },
  { path: '/vendors', icon: Store, label: 'Vendor', roles: ['ADMIN', 'BOD'] },
  { path: '/referral-partners', icon: Handshake, label: 'Đối tác', roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'] },
  { path: '/create-video-ai', icon: Video, label: 'Tạo Video AI'},
  { path: '/library-video-ai', icon: BookText, label: 'Thư viện Video AI'},
  { path: '/document-library', icon: Archive, label: 'Kho tài liệu' },
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
            >
              <item.icon className={cn(
                'h-5 w-5 transition-all shrink-0',
                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500',
                isCollapsed ? 'mr-0' : 'mr-3',
              )} />
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-xl z-50 ">
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              )}
              {!isCollapsed && (
                <span className="truncate transition-opacity duration-300 opacity-100">
                  {item.label}
                </span>
              )}
              {isCollapsed && isActive && (
                <div
                  className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
