import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileText,
  FileSignature, Rocket, CheckSquare, DollarSign, Settings, Store,
  CheckCircle2, Package, User, Handshake, FolderOpenDotIcon, Video, BookText, Megaphone, Bell, Archive,
  Sparkles, ChevronDown, ChartNoAxesCombined
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
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    children: [
      { path: '/dashboard-ai', icon: ChartNoAxesCombined, label: 'Thống kê AI' },
      { path: '/create-video-ai', icon: Video, label: 'Tạo Video AI' },
      { path: '/library-video-ai', icon: BookText, label: 'Thư viện Video AI' },
    ],
  },
  { path: '/document-library', icon: Archive, label: 'Kho tài liệu' },
];

export const Sidebar = ({ isCollapsed }) => {
  const location = useLocation();
  const { data: me } = useGetMeQuery();
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);

  const filteredMenuItems = menuItems
    .filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(me?.role);
    })
    .map((item) => {
      if (!item.children) return item;
      const filteredChildren = item.children.filter((child) => {
        if (!child.roles) return true;
        return child.roles.includes(me?.role);
      });
      return { ...item, children: filteredChildren };
    })
    .filter((item) => {
      if (item.children) return item.children.length > 0;
      return true;
    });

  const [openMenus, setOpenMenus] = useState(() => {
    const initial = {};
    menuItems.forEach((item) => {
      if (item.children?.some((child) => location.pathname === child.path)) {
        initial[item.id || item.label] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children?.some((child) => location.pathname === child.path)) {
        setOpenMenus((prev) => ({ ...prev, [item.id || item.label]: true }));
      }
    });
    setCollapsedFlyout(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCollapsed) {
      setCollapsedFlyout(null);
      return undefined;
    }

    const closeFlyout = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && event.target.closest('[data-sidebar-flyout]')) return;
      setCollapsedFlyout(null);
    };

    window.addEventListener('resize', closeFlyout);
    window.addEventListener('scroll', closeFlyout, true);
    document.addEventListener('pointerdown', closeFlyout);
    document.addEventListener('keydown', closeFlyout);

    return () => {
      window.removeEventListener('resize', closeFlyout);
      window.removeEventListener('scroll', closeFlyout, true);
      document.removeEventListener('pointerdown', closeFlyout);
      document.removeEventListener('keydown', closeFlyout);
    };
  }, [isCollapsed]);

  const toggleSubmenu = (menuId, event) => {
    if (isCollapsed) {
      const rect = event.currentTarget.getBoundingClientRect();
      setCollapsedFlyout((current) => (
        current?.menuId === menuId
          ? null
          : { menuId, top: rect.top, left: rect.right + 12 }
      ));
      return;
    }

    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto z-20 transition-all duration-300 ease-in-out scrollbar-hide",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <nav className="p-3 space-y-1.5">
        {filteredMenuItems.map((item) => {
          if (item.children) {
            const isAnyChildActive = item.children.some((child) => location.pathname === child.path);
            const isOpen = Boolean(openMenus[item.id || item.label]);

            return (
              <div key={item.id || item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={(event) => toggleSubmenu(item.id || item.label, event)}
                  data-sidebar-flyout
                  aria-expanded={isCollapsed
                    ? collapsedFlyout?.menuId === (item.id || item.label)
                    : isOpen}
                  className={cn(
                    'w-full flex items-center px-3 py-3 text-sm font-bold rounded-xl transition-all group relative',
                    isAnyChildActive
                      ? 'bg-indigo-50/70 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600',
                    isCollapsed ? 'justify-center' : 'justify-between'
                  )}
                >
                  <div className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : '')}>
                    <item.icon className={cn(
                      'h-5 w-5 transition-all shrink-0',
                      isAnyChildActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500',
                      isCollapsed ? 'mr-0' : 'mr-3'
                    )} />
                    {!isCollapsed && (
                      <span className="truncate transition-opacity duration-300 opacity-100">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <ChevronDown className={cn(
                      'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ml-2',
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    )} />
                  )}

                  {isCollapsed && isAnyChildActive && (
                    <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
                  )}
                </button>

                {isCollapsed && collapsedFlyout?.menuId === (item.id || item.label) && createPortal(
                  <div
                    data-sidebar-flyout
                    role="menu"
                    aria-label={item.label}
                    className="fixed min-w-52 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-xl z-[100]"
                    style={{ top: collapsedFlyout.top, left: collapsedFlyout.left }}
                  >
                    <div className="text-[11px] font-bold text-slate-300 mb-1 border-b border-slate-700/60 pb-1">
                      {item.label}
                    </div>
                    <div className="space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            role="menuitem"
                            className={cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors',
                              isChildActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="absolute top-6 -left-1 w-2 h-2 bg-slate-900 rotate-45" />
                  </div>,
                  document.body
                )}

                {!isCollapsed && isOpen && (
                  <div className="pl-4 pr-1 py-0.5 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center px-3 py-2.5 text-xs font-bold rounded-lg transition-all relative group/sub',
                            isChildActive
                              ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                          )}
                        >
                          <child.icon className={cn(
                            'h-4 w-4 mr-2.5 transition-all shrink-0',
                            isChildActive ? 'text-indigo-600' : 'text-slate-400 group-hover/sub:text-indigo-500'
                          )} />
                          <span className="truncate">{child.label}</span>
                          {isChildActive && (
                            <div className="absolute left-0 w-1 h-4 bg-indigo-600 rounded-r-full" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
