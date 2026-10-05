// Contract Status
export const CONTRACT_STATUS_LABELS = {
  DRAFT: 'Mới',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PROPOSAL_APPROVED: 'Đã duyệt hợp đồng',
  ACTIVE: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  SIGNED: 'Đã ký',
  PROPOSAL_UPLOADED: 'Đã tải lên hợp đồng',
  PROPOSAL_REJECTED: 'Bị từ chối hợp đồng',
};

export const CONTRACT_STATUS_COLORS = {
  DRAFT: 'bg-orange-50 text-orange-700 border-orange-100',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  PROPOSAL_APPROVED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-orange-50 text-orange-700 border-orange-100',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SIGNED: 'bg-green-100 text-green-800',
  PROPOSAL_UPLOADED: 'bg-green-100 text-green-800',
  PROPOSAL_REJECTED: 'bg-red-100 text-red-800',
};

// Contract Service Status
export const CONTRACT_SERVICE_STATUS_LABELS = {
  ACTIVE: 'Đang thực hiện',
  AWAITING_ACCEPTANCE: 'Sẵn sàng nghiệm thu',
  ACCEPTANCE_REJECTED: 'Từ chối nghiệm thu',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const CONTRACT_SERVICE_STATUS_COLORS = {
  ACTIVE: 'bg-orange-50 text-orange-700 border-orange-100',
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
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  PENDING_PAUSE_APPROVAL: 'Chờ duyệt tạm dừng',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy'
};

export const PROJECT_STATUS_COLORS = {
  PENDING_CONFIRMATION: 'bg-orange-50 text-orange-700 border-orange-100',
  CONFIRMED: 'bg-orange-50 text-orange-700 border-orange-100',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PENDING_PAUSE_APPROVAL: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-100',
  COMPLETED: 'bg-purple-50 text-purple-700 border-purple-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100'
};

// Task Status — 2 trạng thái mới của tính năng tạm dừng dự án
export const TASK_STATUS_LABELS_PAUSE = {
  ON_HOLD: 'Tạm dừng',
  CANCELLED: 'Đã hủy'
};

// Opportunity Status
export const OPPORTUNITY_STATUS_LABELS = {
  OPEN: 'Mới',
  PENDING_OPP_APPROVAL: 'Đang chờ duyệt',
  OPP_REJECTED: 'Không duyệt',
  OPP_APPROVED: 'Đã duyệt',
  QUOTATION: 'Báo giá',
  QUOTATION_DRAFTING: 'Đang làm báo giá',
  PENDING_QUOTE_APPROVAL: 'Chờ duyệt báo giá',
  QUOTE_APPROVED: 'Đã duyệt báo giá',
  CONTRACT_CREATED: 'Đang làm hợp đồng',
  CONTRACT_APPROVED: 'Đã tạo hợp đồng',
  IMPLEMENTATION: 'Đã triển khai',
  PROJECT_ASSIGNED: 'Đã giao dự án'
};

export const OPPORTUNITY_STATUS_COLORS = {
  OPEN: 'bg-orange-50 text-orange-700 border-orange-100',
  PENDING_OPP_APPROVAL: 'bg-yellow-100 text-yellow-800',
  OPP_REJECTED: 'bg-red-100 text-red-800',
  OPP_APPROVED: 'bg-green-100 text-green-800',
  QUOTATION: 'bg-indigo-100 text-indigo-800',
  QUOTATION_DRAFTING: 'bg-purple-100 text-purple-800',
  PENDING_QUOTE_APPROVAL: 'bg-amber-100 text-amber-800',
  QUOTE_APPROVED: 'bg-emerald-100 text-emerald-800',
  CONTRACT_CREATED: 'bg-cyan-100 text-cyan-800',
  CONTRACT_APPROVED: 'bg-green-100 text-green-800',
  IMPLEMENTATION: 'bg-teal-100 text-teal-800',
  LEAD: 'bg-gray-100 text-gray-800',
  QUALIFIED: 'bg-orange-50 text-orange-700 border-orange-100',
  PROPOSAL: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800'
};

// Task Status Keys
export const TASK_STATUS = {
  PENDING: 'PENDING',
  NOT_STARTED: 'NOT_STARTED',
  DOING: 'DOING',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
  AWAITING_PRICING: 'AWAITING_PRICING',
  REJECTED: 'REJECTED',
  AWAITING_ACCEPTANCE: 'AWAITING_ACCEPTANCE',
  AWAITING_REVIEW: 'AWAITING_REVIEW',
  OVERDUE: 'OVERDUE',
  AWAITING_SUPPORT: 'AWAITING_SUPPORT',
  SUPPORT_PENDING: 'SUPPORT_PENDING',
  COMPLETED: 'COMPLETED',
  REWORKING: 'REWORKING',
  INTERNAL_COMPLETED: 'INTERNAL_COMPLETED',
  ACCEPTED: 'ACCEPTED',
  SUPPORT_AWAITING_RETURN: 'SUPPORT_AWAITING_RETURN',
};

// Task Status Display Labels
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: 'Chờ phân công',
  [TASK_STATUS.NOT_STARTED]: 'Chưa thực hiện',
  [TASK_STATUS.DOING]: 'Đang thực hiện',
  [TASK_STATUS.CANCELLED]: 'Đã hủy',
  [TASK_STATUS.AWAITING_PRICING]: 'Chờ định giá',
  [TASK_STATUS.REJECTED]: 'Yêu cầu làm lại',
  [TASK_STATUS.AWAITING_ACCEPTANCE]: 'Đang chờ nghiệm thu',
  [TASK_STATUS.AWAITING_REVIEW]: 'Đang chờ duyệt',
  [TASK_STATUS.OVERDUE]: 'Quá hạn',
  [TASK_STATUS.AWAITING_SUPPORT]: 'Đã nhờ hỗ trợ',
  [TASK_STATUS.SUPPORT_PENDING]: 'Chờ xác nhận hỗ trợ',
  [TASK_STATUS.COMPLETED]: 'Hoàn thành',
  [TASK_STATUS.REWORKING]: 'Đang làm lại',
  [TASK_STATUS.INTERNAL_COMPLETED]: 'Hoàn thành nội bộ',
  [TASK_STATUS.ACCEPTED]: 'Đã được nghiệm thu',
  [TASK_STATUS.SUPPORT_AWAITING_RETURN]: 'Chờ xác nhận hoàn thành',
};

// Task Status Colors
export const TASK_STATUS_COLORS = {
  [TASK_STATUS.PENDING]: 'bg-amber-50 text-amber-700 border-amber-100',
  [TASK_STATUS.NOT_STARTED]: 'bg-slate-50 text-slate-700 border-slate-200',
  [TASK_STATUS.DOING]: 'bg-orange-50 text-orange-700 border-orange-100',
  [TASK_STATUS.DONE]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [TASK_STATUS.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-100',
  [TASK_STATUS.AWAITING_PRICING]: 'bg-orange-50 text-orange-700 border-orange-100',
  [TASK_STATUS.REJECTED]: 'bg-rose-50 text-rose-700 border-rose-100',
  [TASK_STATUS.INTERNAL_COMPLETED]: 'bg-purple-50 text-purple-700 border-purple-100',
  [TASK_STATUS.ACCEPTED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [TASK_STATUS.AWAITING_SUPPORT]: 'bg-rose-50 text-rose-700 border-rose-100',
  [TASK_STATUS.SUPPORT_PENDING]: 'bg-orange-50 text-orange-700 border-orange-100',
  [TASK_STATUS.COMPLETED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [TASK_STATUS.REWORKING]: 'bg-amber-50 text-amber-700 border-amber-100',
  [TASK_STATUS.AWAITING_ACCEPTANCE]: 'bg-amber-50 text-amber-700 border-amber-100',
  [TASK_STATUS.AWAITING_REVIEW]: 'bg-amber-50 text-amber-700 border-amber-100',
  [TASK_STATUS.OVERDUE]: 'bg-rose-50 text-rose-700 border-rose-100',
  [TASK_STATUS.SUPPORT_AWAITING_RETURN]: 'bg-orange-50 text-orange-700 border-orange-100',
};

// Dashboard Urgency Themes
export const URGENCY_THEMES = {
  overdue: { bg: 'bg-red-50', border: 'border-red-200', accent: 'bg-red-600', text: 'text-red-700', icon: 'text-red-500' },
  today: { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-[#F38820]', text: 'text-orange-700', icon: 'text-[#F38820]' },
  soon: { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-600', text: 'text-amber-700', icon: 'text-amber-500' },
  safe: { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-[#F38820]', text: 'text-orange-700', icon: 'text-[#F38820]' },
  completed: { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-600', text: 'text-emerald-700', icon: 'text-emerald-500' },
  cancelled: { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-600', text: 'text-rose-700', icon: 'text-rose-500' }
};

// Dashboard Project Themes
export const PROJECT_CARD_THEMES = {
  ACTIVE: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-[#F38820]' },
  INACTIVE: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', accent: 'bg-slate-400' }
};

// Priority
export const PRIORITY_LABELS = {
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp'
};

export const PRIORITY_COLORS = {
  High: 'bg-rose-50 text-rose-700 border-rose-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100'
};

export const PRIORITY_INDICATOR_COLORS = {
  High: 'border-l-rose-500',
  Medium: 'border-l-amber-500',
  Low: 'border-l-emerald-500'
};

export const QUOTATION_STATUS_COLORS = {
  Draft: 'bg-slate-50 text-slate-700 border-slate-100',
  Sent: 'bg-orange-50 text-orange-700 border-orange-100',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  Expired: 'bg-amber-50 text-amber-700 border-amber-100'
};

export const QUOTATION_STATUS_LABELS = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  ARCHIVED: 'Lưu trữ'
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

export const JOB_CATEGORY_LABELS = {
  QUAY_PHIM: 'Quay phim',
  DUNG_PHIM: 'Dựng phim',
  THIET_KE: 'Thiết kế',
  AI_CONTENT: 'AI Content',
  MARKETING: 'Marketing',
  BIEN_KICH: 'Biên kịch',
  KHAC: 'Khác'
};

export const JOB_CATEGORY_COLORS = {
  QUAY_PHIM: 'bg-blue-50 text-blue-700 border-blue-100',
  DUNG_PHIM: 'bg-purple-50 text-purple-700 border-purple-100',
  THIET_KE: 'bg-pink-50 text-pink-700 border-pink-100',
  AI_CONTENT: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  MARKETING: 'bg-orange-50 text-orange-700 border-orange-100',
  BIEN_KICH: 'bg-amber-50 text-amber-700 border-amber-100',
  KHAC: 'bg-gray-100 text-gray-600 border-gray-200'
};

export const JOB_CATEGORY_OPTIONS = [
  { value: 'QUAY_PHIM', label: JOB_CATEGORY_LABELS.QUAY_PHIM },
  { value: 'DUNG_PHIM', label: JOB_CATEGORY_LABELS.DUNG_PHIM },
  { value: 'THIET_KE', label: JOB_CATEGORY_LABELS.THIET_KE },
  { value: 'AI_CONTENT', label: JOB_CATEGORY_LABELS.AI_CONTENT },
  { value: 'MARKETING', label: JOB_CATEGORY_LABELS.MARKETING },
  { value: 'BIEN_KICH', label: JOB_CATEGORY_LABELS.BIEN_KICH },
  { value: 'KHAC', label: JOB_CATEGORY_LABELS.KHAC }
];

export const JOB_PERFORMER_TYPE = {
  INTERNAL: "Nội bộ",
  PARTNER: "Đối tác",
  VENDOR: "Vendor"
};


export const PARTNER_TYPE_LABELS = {
  BUSINESS: 'Doanh nghiệp',
  INDIVIDUAL: 'Cá nhân'
};

export const TEAM_MEMBER_ROLE = {
  CONTENT_CREATOR: "CONTENT_CREATOR",
  EDITOR: "EDITOR",
  DESIGNER: "DESIGNER",
  CAMERAMAN: "CAMERAMAN",
  ACCOUNT: "ACCOUNT",
  VIDEO_EDITOR: "VIDEO_EDITOR",
  SOCIAL_MEDIA_MANAGER: "SOCIAL_MEDIA_MANAGER",
  PROJECT_MANAGER: "PROJECT_MANAGER"
};


export const USER_ROLE = {
  ADMIN: "Admin",
  BOD: "BOD",
  ADMIN_SALE: "ADMIN kinh doanh",
  BD: "BD",
  PM: "PM",
  CONTENT_A: "Content A",
  CONTENT_B: "Content B",
  CONTENT_C: "Content C",
  CONTENT_D: "Content Intern",
  EDITOR_A: "Editor A",
  EDITOR_B: "Editor B",
  EDITOR_C: "Editor C",
  EDITOR_D: "Editor Intern",
  DESIGNER_A: "Designer A",
  DESIGNER_B: "Designer B",
  DESIGNER_C: "Designer C",
  DESIGNER_D: "Designer Intern",
};

export const SPECIALIZED_STAFF_ROLES = [
  'CONTENT_A',
  'CONTENT_B',
  'CONTENT_C',
  'CONTENT_D',
  'EDITOR_A',
  'EDITOR_B',
  'EDITOR_C',
  'EDITOR_D',
  'DESIGNER_A',
  'DESIGNER_B',
  'DESIGNER_C',
  'DESIGNER_D',
];


export const STAFF_ROLES = [...SPECIALIZED_STAFF_ROLES];

export const USER_ROLE_OPTIONS = [
  { value: 'ADMIN', label: USER_ROLE.ADMIN },
  { value: 'BOD', label: USER_ROLE.BOD },
  { value: 'BD', label: USER_ROLE.BD },
  { value: 'ADMIN_SALE', label: USER_ROLE.ADMIN_SALE },
  { value: 'PM', label: USER_ROLE.PM },
  ...STAFF_ROLES.map((role) => ({ value: role, label: USER_ROLE[role] || role })),
];

export const PROJECT_MEMBER_EXCLUDED_ACCOUNT_ROLES = ['ADMIN_SALE', 'BOD', 'BD'];
export const PROJECT_MANAGEMENT_ROLES = ['ADMIN', 'BOD', 'PM'];
export const ACCEPTANCE_APPROVER_ROLES = ['ADMIN', 'BOD', 'ADMIN_SALE'];

export const USER_ROLE_COLORS = {
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-100',
  BOD: 'bg-amber-50 text-amber-700 border-amber-100',
  BD: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  ADMIN_SALE: 'bg-violet-50 text-violet-700 border-violet-100',
  PM: 'bg-purple-50 text-purple-700 border-purple-100',
  CONTENT_A: 'bg-orange-50 text-orange-700 border-orange-100',
  CONTENT_B: 'bg-orange-50 text-orange-700 border-orange-100',
  CONTENT_C: 'bg-orange-50 text-orange-700 border-orange-100',
  CONTENT_D: 'bg-orange-50 text-orange-700 border-orange-100',
  EDITOR_A: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  EDITOR_B: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  EDITOR_C: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  EDITOR_D: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  DESIGNER_A: 'bg-teal-50 text-teal-700 border-teal-100',
  DESIGNER_B: 'bg-teal-50 text-teal-700 border-teal-100',
  DESIGNER_C: 'bg-teal-50 text-teal-700 border-teal-100',
  DESIGNER_D: 'bg-teal-50 text-teal-700 border-teal-100',
};

export const TEAM_MEMBER_ROLE_LABELS = {
  [TEAM_MEMBER_ROLE.CONTENT_CREATOR]: 'Nội dung',
  [TEAM_MEMBER_ROLE.EDITOR]: 'Biên tập',
  [TEAM_MEMBER_ROLE.DESIGNER]: 'Thiết kế',
  [TEAM_MEMBER_ROLE.VIDEO_EDITOR]: 'Dựng video',
  [TEAM_MEMBER_ROLE.CAMERAMAN]: 'Quay',
  [TEAM_MEMBER_ROLE.ACCOUNT]: 'Account',
  [TEAM_MEMBER_ROLE.SOCIAL_MEDIA_MANAGER]: 'Quản lý MXH',
  [TEAM_MEMBER_ROLE.PROJECT_MANAGER]: 'PM',
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
