import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Ban,
  Pause,
  Play,
  Check,
  FileText,
  Award,
  PlusCircle,
  UserCheck,
  FileEdit,
  UploadCloud,
  PieChart,
  Calendar,
  Lock,
  Archive,
  RefreshCw,
  Circle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Bảng ánh xạ trạng thái chuẩn theo docs/design-tokens.shared.md Mục 3
 */
export const STATUS_MAPPINGS = {
  opportunity: {
    OPEN: { label: 'Mới tạo', tone: 'neutral', icon: PlusCircle },
    PENDING_OPP_APPROVAL: { label: 'Chờ BOD duyệt', tone: 'pending', icon: Clock },
    OPP_REJECTED: { label: 'BOD từ chối', tone: 'negative', icon: XCircle },
    OPP_APPROVED: { label: 'Cơ hội đã duyệt', tone: 'positive', icon: Check },
    QUOTATION_DRAFTING: { label: 'Đang lập báo giá', tone: 'active', icon: FileEdit },
    PENDING_QUOTE_APPROVAL: { label: 'Chờ duyệt báo giá', tone: 'pending', icon: Clock },
    QUOTE_APPROVED: { label: 'Báo giá đã duyệt', tone: 'positive', icon: CheckCircle2 },
    CONTRACT_CREATED: { label: 'Đang làm hợp đồng', tone: 'purple', icon: FileText },
    CONTRACT_APPROVED: { label: 'Hợp đồng đã duyệt', tone: 'positive', icon: CheckCircle2 },
    PROJECT_ASSIGNED: { label: 'Đã giao dự án', tone: 'cyan', icon: UserCheck },
    IMPLEMENTATION: { label: 'Đang triển khai', tone: 'orange', icon: Play },
    COMPLETED: { label: 'Hoàn tất', tone: 'positive', icon: CheckCircle2 },
    CANCELLED: { label: 'Đã hủy', tone: 'neutral', icon: Ban },
    // Aliases
    WON: { label: 'Thành công', tone: 'positive', icon: CheckCircle2 },
    LOST: { label: 'Thất bại', tone: 'negative', icon: XCircle },
    LEAD: { label: 'Khách hàng tiềm năng', tone: 'neutral', icon: Circle },
    CONTACTED: { label: 'Đã liên hệ', tone: 'active', icon: Play },
    PROPOSAL: { label: 'Đã gửi đề xuất', tone: 'pending', icon: Clock },
    NEGOTIATION: { label: 'Đang thương lượng', tone: 'purple', icon: Clock },
  },
  quotation: {
    DRAFT: { label: 'Báo giá nháp', tone: 'neutral', icon: FileText },
    PENDING_APPROVAL: { label: 'Chờ BOD duyệt', tone: 'pending', icon: Clock },
    PENDING: { label: 'Chờ BOD duyệt', tone: 'pending', icon: Clock },
    APPROVED: { label: 'Đã duyệt', tone: 'positive', icon: CheckCircle2 },
    REJECTED: { label: 'Bị từ chối', tone: 'negative', icon: XCircle },
    ARCHIVED: { label: 'Đã lưu trữ', tone: 'neutral', icon: Archive },
  },
  contract: {
    DRAFT: { label: 'Hợp đồng nháp', tone: 'neutral', icon: FileText },
    PENDING: { label: 'Chờ duyệt', tone: 'pending', icon: Clock },
    APPROVED: { label: 'Đã duyệt', tone: 'positive', icon: CheckCircle2 },
    PROPOSAL_UPLOADED: { label: 'Đã tải đề xuất', tone: 'active', icon: UploadCloud },
    PROPOSAL_APPROVED: { label: 'Đề xuất đã duyệt', tone: 'active', icon: Check },
    PROPOSAL_REJECTED: { label: 'Đề xuất bị từ chối', tone: 'negative', icon: XCircle },
    SIGNED: { label: 'Đã ký kết', tone: 'positive', icon: CheckCircle2 },
    ACTIVE: { label: 'Đang thực hiện', tone: 'active', icon: Play },
    COMPLETED: { label: 'Hoàn thành', tone: 'positive', icon: Award },
    CANCELLED: { label: 'Đã hủy', tone: 'neutral', icon: Ban },
  },
  project: {
    PENDING_CONFIRMATION: { label: 'Chờ Team Lead nhận', tone: 'pending', icon: Clock },
    CONFIRMED: { label: 'Đã tiếp nhận', tone: 'active', icon: Check },
    IN_PROGRESS: { label: 'Đang thực hiện', tone: 'active', icon: Play },
    PENDING_PAUSE_APPROVAL: { label: 'Chờ duyệt tạm dừng', tone: 'pending', icon: Clock },
    ON_HOLD: { label: 'Tạm dừng', tone: 'neutral', icon: Pause },
    COMPLETED: { label: 'Hoàn thành', tone: 'positive', icon: CheckCircle2 },
    CANCELLED: { label: 'Đã hủy', tone: 'neutral', icon: Ban },
    PLANNING: { label: 'Đang lập kế hoạch', tone: 'neutral', icon: FileText },
    REVIEW: { label: 'Đang đánh giá', tone: 'pending', icon: Clock },
  },
  task: {
    PENDING: { label: 'Chờ phân công', tone: 'pending', icon: Clock },
    NOT_STARTED: { label: 'Chưa bắt đầu', tone: 'neutral', icon: Circle },
    TODO: { label: 'Cần làm', tone: 'neutral', icon: Circle },
    DOING: { label: 'Đang thực hiện', tone: 'active', icon: Play },
    IN_PROGRESS: { label: 'Đang thực hiện', tone: 'active', icon: Play },
    AWAITING_REVIEW: { label: 'Chờ duyệt nội bộ', tone: 'pending', icon: Clock },
    AWAITING_ACCEPTANCE: { label: 'Chờ khách nghiệm thu', tone: 'pending', icon: Clock },
    INTERNAL_COMPLETED: { label: 'Hoàn thành nội bộ', tone: 'active', icon: Check },
    ACCEPTED: { label: 'Đã nghiệm thu', tone: 'positive', icon: CheckCircle2 },
    COMPLETED: { label: 'Hoàn thành', tone: 'positive', icon: CheckCircle2 },
    DONE: { label: 'Hoàn thành', tone: 'positive', icon: CheckCircle2 },
    REWORKING: { label: 'Đang làm lại', tone: 'warning', icon: RefreshCw },
    ON_HOLD: { label: 'Tạm dừng', tone: 'neutral', icon: Pause },
    OVERDUE: { label: 'Quá hạn', tone: 'negative', icon: AlertTriangle },
    CANCELLED: { label: 'Đã hủy', tone: 'neutral', icon: Ban },
    REJECTED: { label: 'Bị từ chối', tone: 'negative', icon: XCircle },
    REJECTED_BILLABLE: { label: 'Từ chối (tính phí)', tone: 'negative', icon: XCircle },
    REJECTED_SUPPORT: { label: 'Từ chối (hỗ trợ)', tone: 'negative', icon: XCircle },
    AWAITING_PRICING: { label: 'Chờ định giá', tone: 'pending', icon: Clock },
    AWAITING_SUPPORT: { label: 'Chờ hỗ trợ', tone: 'pending', icon: Clock },
    SUPPORT_PENDING: { label: 'Chờ xử lý hỗ trợ', tone: 'pending', icon: Clock },
    SUPPORT_AWAITING_RETURN: { label: 'Chờ trả kết quả', tone: 'pending', icon: Clock },
  },
  paymentRequest: {
    // Approval status
    DRAFT: { label: 'Nháp', tone: 'neutral', icon: FileText },
    PENDING_REVIEWER: { label: 'Chờ quản lý duyệt', tone: 'pending', icon: Clock },
    NEED_MORE_DOCS: { label: 'Cần bổ sung chứng từ', tone: 'warning', icon: AlertCircle },
    PENDING_BOD: { label: 'Chờ BOD duyệt', tone: 'pending', icon: Clock },
    PENDING: { label: 'Chờ duyệt', tone: 'pending', icon: Clock },
    APPROVED: { label: 'Đã duyệt chi', tone: 'positive', icon: CheckCircle2 },
    REJECTED: { label: 'Bị từ chối', tone: 'negative', icon: XCircle },
    CANCELLED: { label: 'Đã hủy', tone: 'neutral', icon: Ban },
    // Due status
    WAITING: { label: 'Chưa đến hạn', tone: 'neutral', icon: Calendar },
    DUE_SOON: { label: 'Sắp đến hạn', tone: 'warning', icon: AlertTriangle },
    OVERDUE: { label: 'Quá hạn thanh toán', tone: 'negative', icon: AlertCircle },
    PARTIALLY_PAID: { label: 'Đã chi một phần', tone: 'active', icon: PieChart },
    PAID: { label: 'Đã chi đủ 100%', tone: 'positive', icon: CheckCircle2 },
  },
  debt: {
    UNPAID: { label: 'Chưa thanh toán', tone: 'pending', icon: Clock },
    PARTIAL: { label: 'Đã thu một phần', tone: 'active', icon: PieChart },
    PAID: { label: 'Đã thu đủ 100%', tone: 'positive', icon: CheckCircle2 },
    OVERDUE: { label: 'Quá hạn thu nợ', tone: 'negative', icon: AlertTriangle },
    LOCKED: { label: 'Đã khóa nợ', tone: 'neutral', icon: Lock },
  },
  acceptance: {
    DRAFT: { label: 'Biên bản nháp', tone: 'neutral', icon: FileText },
    PENDING: { label: 'Chờ duyệt', tone: 'pending', icon: Clock },
    APPROVED: { label: 'Đã duyệt', tone: 'positive', icon: CheckCircle2 },
    PROCESSED: { label: 'Đã xử lý', tone: 'positive', icon: CheckCircle2 },
    REJECTED: { label: 'Bị từ chối', tone: 'negative', icon: XCircle },
    CANCELLED: { label: 'Đã hủy', tone: 'neutral', icon: Ban },
  },
};

/**
 * 5 Tone màu ngữ nghĩa chuẩn hóa (đạt chuẩn tương phản WCAG AA)
 */
export const TONE_STYLES = {
  positive: 'bg-success-light text-success-strong border-transparent',
  pending: 'bg-primary-light text-primary-on-soft border-transparent',
  active: 'bg-info-light text-info-strong border-transparent',
  negative: 'bg-danger-light text-danger-strong border-transparent',
  warning: 'bg-warning-light text-warning-strong border-transparent',
  neutral: 'bg-neutral-light text-neutral-strong border-transparent',
  purple: 'bg-[#F3E8FF] text-[#7E22CE] border-transparent',
  cyan: 'bg-[#ECFEFF] text-[#0E7490] border-transparent',
  orange: 'bg-[#fff0c2] text-[#9A3412] border-transparent',
};

/**
 * Component StatusBadge chuẩn hóa cho Web ERP
 * @param {Object} props
 * @param {'opportunity' | 'contract' | 'quotation' | 'project' | 'task' | 'paymentRequest' | 'debt' | 'acceptance'} props.domain
 * @param {string} props.status
 * @param {'sm' | 'md'} [props.size='md']
 * @param {boolean} [props.hideIcon=false]
 * @param {string} [props.className]
 */
export const StatusBadge = ({
  domain,
  status,
  size = 'md',
  hideIcon = false,
  className,
}) => {
  const domainMap = STATUS_MAPPINGS[domain] || {};
  const config = domainMap[status];

  if (!config) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[StatusBadge] Unknown status "${status}" for domain "${domain}".`);
    }
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium select-none border',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
          TONE_STYLES.neutral,
          className
        )}
      >
        {!hideIcon && <HelpCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        <span>{status || 'Không rõ'}</span>
      </span>
    );
  }

  const { label, tone, icon: IconComponent } = config;
  const toneClass = TONE_STYLES[tone] || TONE_STYLES.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium select-none border',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
        toneClass,
        className
      )}
    >
      {!hideIcon && IconComponent && (
        <IconComponent className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';
