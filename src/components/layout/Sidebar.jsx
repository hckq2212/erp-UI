import { useState, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useGetMeQuery } from '../../api/auth';
import { MENU_ITEMS as menuItems } from '../../config/routes.config';
import { useChatStore } from '../../store/useChatStore';

const SidebarComponent = ({ isCollapsed }) => {
  const location = useLocation();
  const { data: me } = useGetMeQuery();
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  // Lấy số lượng tin nhắn chưa đọc từ useChatStore
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const chatUnreadCount = useMemo(() => {
    return Object.values(unreadCounts || {}).reduce((sum, count) => sum + Number(count || 0), 0);
  }, [unreadCounts]);

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

  const userRole = me?.role;
  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
      })
      .map((item) => {
        if (!item.children) return item;
        const filteredChildren = item.children.filter((child) => {
          if (!child.roles) return true;
          return child.roles.includes(userRole);
        });
        return { ...item, children: filteredChildren };
      })
      .filter((item) => {
        if (item.children) return item.children.length > 0;
        return true;
      });
  }, [userRole]);

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
          const isChatItem = item.path === '/chat';
          const showChatBadge = isChatItem && chatUnreadCount > 0;

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
                isCollapsed ? 'justify-center' : 'justify-between'
              )}
            >
              <div className="flex items-center min-w-0">
                <div className="relative shrink-0 flex items-center justify-center">
                  <item.icon className={cn(
                    'h-5 w-5 transition-all shrink-0',
                    isActive ? 'text-[#F38820]' : 'text-slate-400 group-hover:text-[#F38820]',
                    isCollapsed ? 'mr-0' : 'mr-3',
                  )} />
                  {isCollapsed && showChatBadge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full ring-2 ring-white animate-in zoom-in-75 shadow-xs">
                      {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="truncate transition-opacity duration-300 opacity-100">
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && showChatBadge && (
                <span className="min-w-[18px] h-4 px-1.5 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full shadow-xs shrink-0 animate-in zoom-in-75">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
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

export const Sidebar = memo(SidebarComponent);
