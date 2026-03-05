// Contract Status
export const CONTRACT_STATUS_LABELS = {
  DRAFT: 'Mới',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PROPOSAL_APPROVED: 'Đã duyệt proposal',
  ACTIVE: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  SIGNED: 'Đã ký',
  PROPOSAL_UPLOADED: 'Đã tải lên proposal',
  PROPOSAL_REJECTED: 'Bị từ chối proposal',
};

export const CONTRACT_STATUS_COLORS = {
  DRAFT: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  PROPOSAL_APPROVED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SIGNED: 'bg-green-100 text-green-800',
  PROPOSAL_UPLOADED: 'bg-green-100 text-green-800',
  PROPOSAL_REJECTED: 'bg-red-100 text-red-800',
};

// Contract Service Status
export const CONTRACT_SERVICE_STATUS_LABELS = {
  ACTIVE: 'Đang thực hiện',
  AWAITING_ACCEPTANCE: 'Chờ nghiệm thu',
  ACCEPTANCE_REJECTED: 'Từ chối nghiệm thu',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const CONTRACT_SERVICE_STATUS_COLORS = {
  ACTIVE: 'bg-blue-50 text-blue-700 border-blue-100',
  AWAITING_ACCEPTANCE: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  ACCEPTANCE_REJECTED: 'bg-red-50 text-red-700 border-red-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

// Acceptance Status
export const ACCEPTANCE_STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PROCESSED: 'Đã xử lý',
  CANCELLED: 'Đã hủy',
};

export const ACCEPTANCE_STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  APPROVED: 'bg-green-50 text-green-700 border-green-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

// Project Status
export const PROJECT_STATUS_LABELS = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  PLANNING: 'Lập kế hoạch',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy'
};

export const PROJECT_STATUS_COLORS = {
  PENDING_CONFIRMATION: 'bg-orange-100 text-orange-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

// Opportunity Status
export const OPPORTUNITY_STATUS_LABELS = {
  OPEN: 'Mới',
  PENDING_OPP_APPROVAL: 'Đang chờ duyệt',
  OPP_APPROVED: 'Đã duyệt',
  QUOTATION: 'Báo giá',
  QUOTATION_DRAFTING: 'Đang làm báo giá',
  PENDING_QUOTE_APPROVAL: 'Chờ duyệt báo giá',
  QUOTE_APPROVED: 'Đã duyệt báo giá',
  CONTRACT_CREATED: 'Đã tạo hợp đồng',
  IMPLEMENTATION: 'Đã triển khai',
  PROJECT_ASSIGNED: 'Đã giao dự án'
};

export const OPPORTUNITY_STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800',
  PENDING_OPP_APPROVAL: 'bg-yellow-100 text-yellow-800',
  OPP_APPROVED: 'bg-green-100 text-green-800',
  QUOTATION: 'bg-indigo-100 text-indigo-800',
  QUOTATION_DRAFTING: 'bg-purple-100 text-purple-800',
  PENDING_QUOTE_APPROVAL: 'bg-amber-100 text-amber-800',
  QUOTE_APPROVED: 'bg-emerald-100 text-emerald-800',
  CONTRACT_CREATED: 'bg-cyan-100 text-cyan-800',
  IMPLEMENTATION: 'bg-teal-100 text-teal-800',
  LEAD: 'bg-gray-100 text-gray-800',
  QUALIFIED: 'bg-blue-100 text-blue-800',
  PROPOSAL: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800'
};

// Task Status
export const TASK_STATUS_LABELS = {
  PENDING: 'Chờ phân công',
  DOING: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  AWAITING_PRICING: 'Chờ định giá',
  REJECTED: 'Yêu cầu làm lại',
  AWAITING_ACCEPTANCE: 'Đang chờ nghiệm thu',
  AWAITING_REVIEW: 'Đang chờ duyệt',
  OVERDUE: 'Quá hạn'
};

export const TASK_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOING: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  AWAITING_PRICING: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-800',
  DOING: 'bg-blue-100 text-blue-800'
};

// Priority
export const PRIORITY_LABELS = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao'
};

export const PRIORITY_COLORS = {
  Low: 'bg-green-100 text-green-800 border-green-200',
  Medium: 'bg-orange-100 text-orange-800 border-orange-200',
  High: 'bg-red-100 text-red-800 border-red-200'
};

// Field
export const FIELD_LABELS = {
  CNTT: 'Công nghệ thông tin',
  XayDung: 'Xây dựng',
  SanXuat: 'Sản xuất',
  ThuongMai: 'Thương mại',
  DichVu: 'Dịch vụ',
  GiaoDuc: 'Giáo dục',
  YTe: 'Y tế',
  TaiChinh: 'Tài chính',
  BatDongSan: 'Bất động sản',
  Khac: 'Khác'
};

export const JOB_PERFORMER_TYPE = {
  INTERNAL: "Nội bộ",
  PARTNER: "Đối tác",
  VENDOR: "Vendor"
};

export const TASK_STATUS = {
  PENDING: "Chờ xử lý",
  DOING: "Đang thực hiện",
  DONE: "Hoàn thành",
  AWAITING_ACCEPTANCE: "Đang chờ nghiệm thu",
  AWAITING_REVIEW: "Đang chờ duyệt",
  AWAITING_PRICING: "Chờ định giá",
  CANCELLED: "Đã hủy",
  OVERDUE: "Quá hạn"
};

export const PARTNER_TYPE_LABELS = {
  BUSINESS: 'Doanh nghiệp',
  INDIVIDUAL: 'Cá nhân'
};

export const TEAM_MEMBER_ROLE = {
  CONTENT_CREATOR: "CONTENT_CREATOR",
  EDITOR: "EDITOR",
  GRAPHIC_DESIGNER: "GRAPHIC_DESIGNER",
  CAMERAMAN: "CAMERAMAN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  ACCOUNT_MANAGER: "ACCOUNT_MANAGER",
  SCRIPTER: "SCRIPTER",
  SOCIAL_MEDIA_MANAGER: "SOCIAL_MEDIA_MANAGER",
  SEO_SPECIALIST: "SEO_SPECIALIST"
};

export const TEAM_MEMBER_ROLE_LABELS = {
  [TEAM_MEMBER_ROLE.CONTENT_CREATOR]: 'Nội dung',
  [TEAM_MEMBER_ROLE.EDITOR]: 'Editor',
  [TEAM_MEMBER_ROLE.GRAPHIC_DESIGNER]: 'Thiết kế đồ họa',
  [TEAM_MEMBER_ROLE.CAMERAMAN]: 'Quay phim',
  [TEAM_MEMBER_ROLE.PROJECT_MANAGER]: 'Quản lý dự án',
  [TEAM_MEMBER_ROLE.ACCOUNT_MANAGER]: 'Quản lý khách hàng',
  [TEAM_MEMBER_ROLE.SCRIPTER]: 'Biên kịch',
  [TEAM_MEMBER_ROLE.SOCIAL_MEDIA_MANAGER]: 'Quản lý MXH',
  [TEAM_MEMBER_ROLE.SEO_SPECIALIST]: 'Chuyên viên SEO'
};

export const QUOTATION_TYPE = {
  STANDARD: 'STANDARD',
  ADDENDUM: 'ADDENDUM'
};

// Banks
export const VIETNAM_BANKS = [
  'Vietcombank',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'MB Bank',
  'Agribank',
  'ACB',
  'Sacombank',
  'TPBank',
  'VIB',
  'VPBank',
  'SeABank',
  'MSB',
  'SHB',
  'HDBank',
  'Eximbank',
  'OCB',
  'NCB',
  'Kienlongbank',
  'BaoVietBank',
  'VietBank',
  'VietCapitalBank',
  'SaiGonBank',
  'BacABank',
  'DongABank',
  'GPBank',
  'OceanBank',
  'PGBank',
  'LienVietPostBank',
  'VietABank',
];
