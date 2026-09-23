import { hasTeamMemberRole } from './teamMember';

/**
 * Hằng số và logic quyền cho luồng TẠM DỪNG DỰ ÁN (mirror backend).
 *
 * ⚠️ Đây là bản sao NHỎ của luật ở backend — chỉ để ẨN/HIỆN nút cho đúng.
 * Backend vẫn là nơi quyết định cuối cùng; UI không thay thế được validate.
 */

/** Số ngày tạm dừng trước khi hệ thống tự động đóng dự án. */
export const PAUSE_DURATION_DAYS = 37;

/** Số ngày cuối trước D+37 mà hệ thống gửi thông báo nhắc nhở hằng ngày. */
export const REMINDER_WINDOW_DAYS = 7;

/** 3 trạng thái cuối được miễn trừ khi tạm dừng — giữ nguyên status. */
export const HOLD_EXEMPT_TASK_STATUSES = ['COMPLETED', 'INTERNAL_COMPLETED', 'ACCEPTED'];

export const PROJECT_STATUS = {
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_PAUSE_APPROVAL: 'PENDING_PAUSE_APPROVAL',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const PAUSE_REQUEST_STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  RESUMED: 'Đã làm tiếp',
  CLOSED: 'Đã đóng dự án',
};

export const PAUSE_REQUEST_STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  APPROVED: 'bg-amber-50 text-amber-700 border-amber-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  RESUMED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const PAUSE_MODE_LABELS = {
  REQUEST: 'Xin phép duyệt',
  DIRECT: 'Quyết định trực tiếp',
};

export const CLOSE_MODE_LABELS = {
  REQUEST: 'PM đề nghị, BOD duyệt',
  DIRECT: 'Đóng trực tiếp',
};

/** Lấy user id của actor từ object user của web (có thể là userId hoặc id). */
const actorId = (user) => user?.userId || user?.user?.id || user?.profile?.id || user?.id;

const isSameId = (a, b) => Boolean(a && b && String(a) === String(b));

/** BOD hoặc ADMIN — nhóm quản lý cao nhất. */
export const isManagement = (user) => ['BOD', 'ADMIN'].includes(user?.role);

/**
 * PM của dự án (member role PROJECT_MANAGER) hoặc Team Lead.
 * Dùng để quyết định PM có được GỬI yêu cầu tạm dừng không.
 */
export const isProjectPm = (project, user) => {
  const uid = actorId(user);
  if (!uid) return false;
  if (isSameId(project?.team?.teamLead?.id, uid)) return true;
  return Boolean(project?.team?.members?.some(
    (m) => isSameId(m.user?.id, uid) && hasTeamMemberRole(m, 'PROJECT_MANAGER')
  ));
};

/**
 * BD phụ trách hợp đồng / dự án:
 * Ưu tiên: 1. contract.createdBy -> 2. contract.opportunity.createdBy -> 3. contract.customer.createdBy
 */
export const isProjectBdOwner = (project, user) => {
  const uid = actorId(user);
  if (!uid) return false;
  const contract = project?.contract;
  if (!contract) return false;

  const bdOwnerId =
    contract?.createdById ||
    contract?.createdBy?.id ||
    contract?.opportunity?.createdById ||
    contract?.opportunity?.createdBy?.id ||
    contract?.customer?.createdById ||
    contract?.customer?.createdBy?.id;
  console.log(contract?.createdBy);
  return isSameId(bdOwnerId, uid);
};

/** Có được GỬI yêu cầu tạm dừng (chờ BOD duyệt) không. */
export const canRequestPause = (project, user) => {
  if (project?.status !== PROJECT_STATUS.IN_PROGRESS) return false;
  if (isManagement(user)) return true;
  if (user?.role === 'PM') return isProjectPm(project, user);
  if (user?.role === 'BD') return isProjectBdOwner(project, user);
  return false;
};

/** Có được TẠM DỪNG TRỰC TIẾP (không qua duyệt) không — chỉ BOD/ADMIN. */
export const canPauseDirect = (project, user) =>
  project?.status === PROJECT_STATUS.IN_PROGRESS && isManagement(user);

/** Có được DUYỆT đơn tạm dừng không — chỉ BOD/ADMIN. */
export const canApprovePause = (user) => isManagement(user);

/** Có được LÀM TIẾP không — PM dự án / BD phụ trách HĐ / BOD / ADMIN. */
export const canResume = (project, user) => {
  if (project?.status !== PROJECT_STATUS.ON_HOLD) return false;
  if (isManagement(user)) return true;
  if (user?.role === 'PM') return isProjectPm(project, user);
  if (user?.role === 'BD') return isProjectBdOwner(project, user);
  return false;
};

/**
 * Có được ĐÓNG DỰ ÁN TRỰC TIẾP (không cần duyệt) không.
 * BD phụ trách HĐ / BOD / ADMIN. PM KHÔNG có quyền này.
 */
export const canCloseDirect = (project, user) => {
  if (project?.status !== PROJECT_STATUS.ON_HOLD) return false;
  if (isManagement(user)) return true;
  if (user?.role === 'BD') return isProjectBdOwner(project, user);
  return false;
};

/** Có được ĐỀ NGHỊ đóng (chờ BOD duyệt) không — PM dự án hoặc quản lý. */
export const canRequestClose = (project, user) => {
  if (project?.status !== PROJECT_STATUS.ON_HOLD) return false;
  if (isManagement(user)) return true;
  if (user?.role === 'PM') return isProjectPm(project, user);
  return false;
};

/** Có được DUYỆT đơn đóng dự án không — BOD / ADMIN / ADMIN_SALE. */
export const canApproveClose = (user) =>
  ['BOD', 'ADMIN', 'ADMIN_SALE'].includes(user?.role);

/** Có được MỞ KHÓA công nợ không — chỉ BOD/ADMIN. */
export const canUnlockDebt = (user) => isManagement(user);

/**
 * Số ngày còn lại tới mốc tự động đóng. Trả `null` nếu không ở trạng thái tạm dừng.
 * Dùng cho banner đếm ngược.
 */
export const daysUntilAutoClose = (project) => {
  if (project?.status !== PROJECT_STATUS.ON_HOLD || !project?.autoAcceptAt) return null;
  const diffMs = new Date(project.autoAcceptAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86400000));
};

/** Đã vào cửa sổ nhắc nhở (7 ngày cuối) chưa. */
export const isInReminderWindow = (daysLeft) =>
  daysLeft !== null && daysLeft <= REMINDER_WINDOW_DAYS;

/** Format ngày giờ VN cho lịch sử. */
export const formatDateTimeVN = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
