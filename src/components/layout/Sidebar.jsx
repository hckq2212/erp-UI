import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileText,
  FileSignature, Rocket, CheckSquare, DollarSign, Settings, Store,
  CheckCircle2, Package, User, Handshake, FolderOpenDotIcon, Video, BookText, Megaphone, Bell, Archive,
  Sparkles, ChevronDown, ChartNoAxesCombined, MessageSquare, Wallet, FileCheck, Receipt
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
  { path: '/payment-requests', icon: Wallet, label: 'Yêu cầu thanh toán' },
  {
    id: 'payments',
    label: 'Thanh toán',
    icon: DollarSign,
    roles: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'],
    children: [
      { path: '/finance/overview', icon: LayoutDashboard, label: 'Tổng quan' },
      { path: '/finance/acceptance-minutes', icon: FileCheck, label: 'Biên bản nghiệm thu' },
      { path: '/finance/vat-invoices', icon: Receipt, label: 'Hóa đơn VAT' },
      { path: '/finance', icon: FileText, label: 'Lộ trình thanh toán' },
    ],
  },
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
  { path: '/chat', icon: MessageSquare, label: 'Tin nhắn' },
  { path: '/settings', icon: Settings, label: 'Cài đặt', roles: ['ADMIN'] },
];

export const Sidebar = ({ isCollapsed }) => {
  const location = useLocation();
  const { data: me } = useGetMeQuery();
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const handleMouseEnter = (label, event) => {
    if (!isCollapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };

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
    setHoveredTooltip(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCollapsed) {
      setCollapsedFlyout(null);
      setHoveredTooltip(null);
      return undefined;
    }

    const closeFlyout = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && event.target.closest('[data-sidebar-flyout]')) return;
      setCollapsedFlyout(null);
    };

    const handleScrollOrResize = (event) => {
      closeFlyout(event);
      setHoveredTooltip(null);
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('pointerdown', closeFlyout);
    document.addEventListener('keydown', closeFlyout);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('pointerdown', closeFlyout);
      document.removeEventListener('keydown', closeFlyout);
    };
  }, [isCollapsed]);

  const toggleSubmenu = (item, event) => {
    setHoveredTooltip(null);
    const menuId = item.id || item.label;
    if (isCollapsed) {
      const rect = event.currentTarget.getBoundingClientRect();
      const viewportPadding = 8;
      const estimatedFlyoutHeight = 48 + (item.children?.length || 0) * 36;
      const availableHeight = window.innerHeight - viewportPadding * 2;
      const flyoutHeight = Math.min(estimatedFlyoutHeight, availableHeight);
      const top = Math.max(
        viewportPadding,
        Math.min(rect.top, window.innerHeight - flyoutHeight - viewportPadding),
      );
      const arrowTop = Math.max(
        12,
        Math.min(rect.top + rect.height / 2 - top - 4, flyoutHeight - 20),
      );
      setCollapsedFlyout((current) => (
        current?.menuId === menuId
          ? null
          : { menuId, top, left: rect.right + 12, arrowTop }
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
            const checkChildActive = (childPath) => {
              const currentFullUrl = location.pathname + location.search;
              if (childPath.includes('?')) {
                return currentFullUrl === childPath;
              }
              return location.pathname === childPath && !location.search;
            };

            const isAnyChildActive = item.children.some((child) =>
              checkChildActive(child.path) || location.pathname === child.path.split('?')[0]
            );
            const isOpen = Boolean(openMenus[item.id || item.label]);

            return (
              <div key={item.id || item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={(event) => toggleSubmenu(item, event)}
                  onMouseEnter={(event) => {
                    if (collapsedFlyout?.menuId !== (item.id || item.label)) {
                      handleMouseEnter(item.label, event);
                    }
                  }}
                  onMouseLeave={handleMouseLeave}
                  data-sidebar-flyout
                  aria-expanded={isCollapsed
                    ? collapsedFlyout?.menuId === (item.id || item.label)
                    : isOpen}
                  className={cn(
                    'w-full flex items-center px-3 py-3 text-sm font-bold rounded-xl transition-all group relative',
                    isAnyChildActive
                      ? 'bg-orange-50 text-[#F38820] shadow-xs'
                      : 'text-slate-600 hover:bg-orange-50/60 hover:text-[#F38820]',
                    isCollapsed ? 'justify-center' : 'justify-between'
                  )}
                >
                  <div className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : '')}>
                    <item.icon className={cn(
                      'h-5 w-5 transition-all shrink-0',
                      isAnyChildActive ? 'text-[#F38820]' : 'text-slate-400 group-hover:text-[#F38820]',
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
                      isOpen ? 'rotate-180 text-[#F38820]' : ''
                    )} />
                  )}

                  {isCollapsed && isAnyChildActive && (
                    <div className="absolute left-0 w-1 h-6 bg-[#F38820] rounded-r-full shadow-[0_0_8px_rgba(243,136,32,0.4)]" />
                  )}
                </button>

                {isCollapsed && collapsedFlyout?.menuId === (item.id || item.label) && createPortal(
                  <div
                    data-sidebar-flyout
                    role="menu"
                    aria-label={item.label}
                    className="fixed min-w-56 text-slate-800 text-xs font-medium whitespace-nowrap z-[100] animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: collapsedFlyout.top, left: collapsedFlyout.left }}
                  >
                    <div className="max-h-[calc(100vh-1rem)] overflow-y-auto rounded-xl bg-white border border-slate-200 px-2 py-2 shadow-2xl shadow-slate-900/10">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                        <span>{item.label}</span>
                      </div>
                      <div className="space-y-0.5">
                        {item.children.map((child) => {
                          const isChildActive = checkChildActive(child.path);
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              role="menuitem"
                              className={cn(
                                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group/flyout',
                                isChildActive
                                  ? 'bg-orange-50 text-[#F38820] shadow-xs'
                                  : 'text-slate-600 hover:bg-orange-50/60 hover:text-[#F38820]'
                              )}
                            >
                              <child.icon className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isChildActive ? 'text-[#F38820]' : 'text-slate-400 group-hover/flyout:text-[#F38820]'
                              )} />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className="absolute -left-1 w-2.5 h-2.5 bg-white border-l border-b border-slate-200 rotate-45"
                      style={{ top: collapsedFlyout.arrowTop }}
                    />
                  </div>,
                  document.body
                )}

                {!isCollapsed && isOpen && (
                  <div className="pl-4 pr-1 py-0.5 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = checkChildActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center px-3 py-2.5 text-xs font-bold rounded-lg transition-all relative group/sub',
                            isChildActive
                              ? 'bg-orange-50 text-[#F38820] shadow-xs'
                              : 'text-slate-500 hover:bg-orange-50/50 hover:text-[#F38820]'
                          )}
                        >
                          <child.icon className={cn(
                            'h-4 w-4 mr-2.5 transition-all shrink-0',
                            isChildActive ? 'text-[#F38820]' : 'text-slate-400 group-hover/sub:text-[#F38820]'
                          )} />
                          <span className="truncate">{child.label}</span>
                          {isChildActive && (
                            <div className="absolute left-0 w-1 h-4 bg-[#F38820] rounded-r-full" />
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
              onMouseEnter={(event) => handleMouseEnter(item.label, event)}
              onMouseLeave={handleMouseLeave}
              onClick={handleMouseLeave}
              className={cn(
                'flex items-center px-3 py-3 text-sm font-bold rounded-xl transition-all group relative',
                isActive
                  ? 'bg-orange-50 text-[#F38820] shadow-sm'
                  : 'text-slate-600 hover:bg-orange-50/60 hover:text-[#F38820]',
                isCollapsed ? 'justify-center' : ''
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 transition-all shrink-0',
                isActive ? 'text-[#F38820]' : 'text-slate-400 group-hover:text-[#F38820]',
                isCollapsed ? 'mr-0' : 'mr-3',
              )} />
              {!isCollapsed && (
                <span className="truncate transition-opacity duration-300 opacity-100">
                  {item.label}
                </span>
              )}
              {isCollapsed && isActive && (
                <div
                  className="absolute left-0 w-1 h-6 bg-[#F38820] rounded-r-full shadow-[0_0_8px_rgba(243,136,32,0.4)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {isCollapsed && hoveredTooltip && createPortal(
        <div
          className="fixed px-3 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 shadow-xl shadow-slate-900/10 pointer-events-none whitespace-nowrap z-[100] transition-all animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: hoveredTooltip.top,
            left: hoveredTooltip.left,
            transform: 'translateY(-50%)',
          }}
        >
          {hoveredTooltip.label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white border-l border-b border-slate-200 rotate-45" />
        </div>,
        document.body
      )}
    </aside>
  );
};
