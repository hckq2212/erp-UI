import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  FileSignature,
  CheckSquare,
  DollarSign,
  Settings,
  Store,
  CheckCircle2,
  Package,
  User,
  Handshake,
  FolderOpenDotIcon,
  Video,
  BookText,
  Archive,
  Sparkles,
  ChartNoAxesCombined,
  Wallet,
  FileCheck,
  Receipt,
} from 'lucide-react';

/**
 * Nhóm các vai trò phân quyền dùng chung cho RBAC
 */
export const ROLE_GROUPS = {
  SALES_AND_LEADERSHIP: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE'],
  OPERATIONS_AND_SALES: ['ADMIN', 'BOD', 'BD', 'ADMIN_SALE', 'PM'],
  ACCEPTANCE_MANAGERS: ['ADMIN', 'BOD', 'ADMIN_SALE', 'PM'],
  BOD_AND_ADMIN: ['ADMIN', 'BOD'],
  VENDOR_MANAGERS: ['ADMIN', 'BOD', 'PM'],
  ADMIN_ONLY: ['ADMIN'],
};

/**
 * Ma trận phân quyền cho từng Route URL (Bảo vệ cấp độ Router)
 * Tuyệt đối chặn khi truy cập trực tiếp bằng thanh địa chỉ (Address Bar).
 */
export const ROUTE_PERMISSIONS = {
  // Khách hàng & Cơ hội
  '/customers': ROLE_GROUPS.SALES_AND_LEADERSHIP,
  '/customers/:id': ROLE_GROUPS.SALES_AND_LEADERSHIP,
  '/opportunities': ROLE_GROUPS.SALES_AND_LEADERSHIP,
  '/opportunities/:id': ROLE_GROUPS.SALES_AND_LEADERSHIP,

  // Hợp đồng & Nghiệm thu
  '/contracts': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/contracts/:id': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/acceptance': ROLE_GROUPS.ACCEPTANCE_MANAGERS,

  // Tài chính & Thanh toán
  '/finance': ROLE_GROUPS.SALES_AND_LEADERSHIP,
  '/finance/overview': ROLE_GROUPS.SALES_AND_LEADERSHIP,
  '/finance/acceptance-minutes': ROLE_GROUPS.SALES_AND_LEADERSHIP,
  '/finance/vat-invoices': ROLE_GROUPS.SALES_AND_LEADERSHIP,

  // Dịch vụ, Hạng mục, Đội dự án
  '/service-packages': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/service-packages/:id': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/services': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/services/:id': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/jobs': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/jobs/:id': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/teams': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/teams/:id': ROLE_GROUPS.OPERATIONS_AND_SALES,

  // Quản lý Nhân sự, Đối tác, Vendor
  '/users': ROLE_GROUPS.BOD_AND_ADMIN,
  '/users/:id': ROLE_GROUPS.BOD_AND_ADMIN,
  '/vendors': ROLE_GROUPS.VENDOR_MANAGERS,
  '/vendors/:id': ROLE_GROUPS.VENDOR_MANAGERS,
  '/referral-partners': ROLE_GROUPS.OPERATIONS_AND_SALES,
  '/referral-partners/:id': ROLE_GROUPS.OPERATIONS_AND_SALES,

  // Cài đặt hệ thống
  '/settings': ROLE_GROUPS.ADMIN_ONLY,
};

/**
 * Danh sách menu hiển thị trên Sidebar (Đồng bộ quyền với ROUTE_PERMISSIONS)
 */
export const MENU_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/opportunities', icon: Briefcase, label: 'Cơ Hội', roles: ROUTE_PERMISSIONS['/opportunities'] },
  { path: '/contracts', icon: FileSignature, label: 'Hợp Đồng', roles: ROUTE_PERMISSIONS['/contracts'] },
  { path: '/customers', icon: Users, label: 'Khách Hàng', roles: ROUTE_PERMISSIONS['/customers'] },
  { path: '/projects', icon: FolderOpenDotIcon, label: 'Dự Án' },
  { path: '/tasks', icon: CheckSquare, label: 'Công Việc' },
  { path: '/acceptance', icon: CheckCircle2, label: 'Nghiệm thu', roles: ROUTE_PERMISSIONS['/acceptance'] },
  { path: '/payment-requests', icon: Wallet, label: 'Yêu cầu thanh toán' },
  {
    id: 'payments',
    label: 'Thanh toán',
    icon: DollarSign,
    roles: ROLE_GROUPS.SALES_AND_LEADERSHIP,
    children: [
      { path: '/finance/overview', icon: LayoutDashboard, label: 'Tổng quan', roles: ROUTE_PERMISSIONS['/finance/overview'] },
      { path: '/finance/acceptance-minutes', icon: FileCheck, label: 'Biên bản nghiệm thu', roles: ROUTE_PERMISSIONS['/finance/acceptance-minutes'] },
      { path: '/finance/vat-invoices', icon: Receipt, label: 'Hóa đơn VAT', roles: ROUTE_PERMISSIONS['/finance/vat-invoices'] },
      { path: '/finance', icon: FileText, label: 'Lộ trình thanh toán', roles: ROUTE_PERMISSIONS['/finance'] },
    ],
  },
  { path: '/service-packages', icon: Package, label: 'Gói dịch vụ', roles: ROUTE_PERMISSIONS['/service-packages'] },
  { path: '/services', icon: Briefcase, label: 'Dịch vụ', roles: ROUTE_PERMISSIONS['/services'] },
  { path: '/jobs', icon: CheckSquare, label: 'Hạng mục công việc', roles: ROUTE_PERMISSIONS['/jobs'] },
  { path: '/teams', icon: Users, label: 'Đội dự án', roles: ROUTE_PERMISSIONS['/teams'] },
  { path: '/users', icon: User, label: 'Nhân sự', roles: ROUTE_PERMISSIONS['/users'] },
  { path: '/vendors', icon: Store, label: 'Vendor', roles: ROUTE_PERMISSIONS['/vendors'] },
  { path: '/referral-partners', icon: Handshake, label: 'Đối tác', roles: ROUTE_PERMISSIONS['/referral-partners'] },
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
  { path: '/settings', icon: Settings, label: 'Cài đặt', roles: ROUTE_PERMISSIONS['/settings'] },
];
