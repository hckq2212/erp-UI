import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hasTeamMemberRole } from '../../../utils/teamMember';
import {
  ArrowLeft, CalendarPlus, CheckCircle, RefreshCw, UserPlus,
  PauseCircle, Archive, PlayCircle, AlertTriangle, Clock,
  Wallet, Receipt, PiggyBank, TrendingUp,
} from 'lucide-react';
import {
  useGetProjectQuery,
  useAssignProjectMutation,
  useConfirmProjectMutation,
  useSyncProjectServiceJobsMutation,
  useResumeProjectMutation,
} from '../../../api/projects';
import { useGetProjectBudgetSummaryQuery } from '../../../api/paymentRequests';
import { PROJECT_MANAGEMENT_ROLES, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, USER_ROLE } from '../../../utils/enums';
import {
  PROJECT_STATUS as PAUSE_STATUS,
  canRequestPause,
  canPauseDirect,
  canResume,
  canCloseDirect,
  canRequestClose,
  daysUntilAutoClose,
  isInReminderWindow,
} from '../../../utils/projectPause';
import { useGetUsersQuery } from '../../../api/users';
import { TaskStatistics } from './TaskStatistics';
import { TaskTable } from './TaskTable';
import { ProjectInfo } from './ProjectInfo';
import { ContractInfo } from './ContractInfo';
import { TeamInfo } from './TeamInfo';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/authSlice';
import { CreateMonthlyWorkModal } from './CreateMonthlyWorkModal';
import { ExtraTasksSection } from './ExtraTasksSection';
import { PauseProjectModal } from './PauseProjectModal';
import { CloseProjectModal } from './CloseProjectModal';
import { PauseHistorySection } from './PauseHistorySection';
import { getCurrentUserId, isSameUser } from '../../../utils/authUser';
import { cn } from '../../../utils/cn';
import { formatNumber } from '../../../utils/format';

const serviceSummaryCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

const getContractServiceName = (service) => service.name || service.service?.name || `Dịch vụ #${service.id}`;
const getContractServiceKey = (service) => service.serviceId || service.service?.id || getContractServiceName(service);

export const ProjectFinanceWidget = ({ budgetSummary, isLoading }) => {
  const totalBudget = budgetSummary?.totalProjectBudget || 0;
  const totalSpent = budgetSummary?.totalProjectSpent || 0;
  const remaining = budgetSummary?.remainingProjectBudget ?? (totalBudget - totalSpent);
  const percentage = budgetSummary?.disbursementPercentage || (totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0);
  const isOverBudget = remaining < 0;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-56 bg-slate-200 rounded-lg mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="h-24 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F38820] to-amber-500 text-white shadow-md shadow-orange-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight truncate">
              Tổng quan Tài chính & Ngân sách
            </h2>
            <p className="text-[11px] font-medium text-slate-400 truncate">
              Đối soát Hợp đồng dịch vụ và Đề nghị thanh toán
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-xs border",
            isOverBudget 
              ? "bg-rose-50 text-rose-700 border-rose-200" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
          )}>
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isOverBudget ? "bg-rose-400" : "bg-emerald-400"
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isOverBudget ? "bg-rose-500" : "bg-emerald-500"
              )} />
            </span>
            {isOverBudget ? "Vượt ngân sách" : "Trong định mức"}
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Tổng ngân sách */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate">
              Ngân sách HĐ
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg xl:text-xl font-black tracking-tight text-slate-900 truncate">
              {formatNumber(totalBudget)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 shrink-0">VNĐ</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-medium text-slate-500">
            <span className="truncate">Định mức</span>
            <span className="font-bold text-blue-600 shrink-0">100%</span>
          </div>
        </div>

        {/* 2. Tổng thực chi */}
        <div className="group relative overflow-hidden rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-orange-300">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 truncate">
              Thực chi (ĐNTT)
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F38820] to-amber-500 text-white shadow-sm shadow-orange-500/20">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg xl:text-xl font-black tracking-tight text-[#F38820] truncate">
              {formatNumber(totalSpent)}
            </span>
            <span className="text-[10px] font-bold text-amber-600/70 shrink-0">VNĐ</span>
          </div>
          <div className="mt-2 pt-2 border-t border-orange-100/60 flex items-center justify-between text-[10px] font-medium text-amber-800/80">
            <span className="truncate">Đã duyệt</span>
            <span className="font-extrabold text-[#F38820] shrink-0">{percentage}%</span>
          </div>
        </div>

        {/* 3. Ngân sách còn lại */}
        <div className={cn(
          "group relative overflow-hidden rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          isOverBudget
            ? "border-rose-200/80 bg-gradient-to-br from-rose-50/40 via-white to-red-50/30 hover:border-rose-300"
            : "border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 hover:border-emerald-300"
        )}>
          <div className="flex items-center justify-between gap-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider truncate",
              isOverBudget ? "text-rose-800" : "text-emerald-800"
            )}>
              Còn lại
            </span>
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-xs",
              isOverBudget
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            )}>
              <PiggyBank className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={cn(
              "text-lg xl:text-xl font-black tracking-tight truncate",
              isOverBudget ? "text-rose-600" : "text-emerald-700"
            )}>
              {formatNumber(remaining)}
            </span>
            <span className={cn(
              "text-[10px] font-bold shrink-0",
              isOverBudget ? "text-rose-500" : "text-emerald-600/70"
            )}>VNĐ</span>
          </div>
          <div className={cn(
            "mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-medium",
            isOverBudget ? "border-rose-100/60 text-rose-700" : "border-emerald-100/60 text-emerald-800/80"
          )}>
            <span className="truncate">{isOverBudget ? "Vượt" : "Khả dụng"}</span>
            <span className={cn(
              "font-extrabold shrink-0",
              isOverBudget ? "text-rose-600" : "text-emerald-700"
            )}>
              {isOverBudget 
                ? `+${formatNumber(Math.abs(remaining))} VNĐ` 
                : `${totalBudget > 0 ? Math.round((remaining / totalBudget) * 1000) / 10 : 0}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar % giải ngân hiện đại */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F38820]/10 text-[#F38820]">
              <TrendingUp className="h-3 w-3" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Tỷ lệ giải ngân:</span>
            <span className={cn(
              "text-xs font-black",
              isOverBudget ? "text-rose-600" : percentage > 80 ? "text-amber-600" : "text-[#F38820]"
            )}>
              {percentage}%
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 truncate">
            Đã chi: <span className="font-extrabold text-slate-800">{formatNumber(totalSpent)} VNĐ</span> / <span className="text-slate-600">{formatNumber(totalBudget)} VNĐ</span>
          </div>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out shadow-xs",
              isOverBudget
                ? "bg-gradient-to-r from-rose-500 to-red-600"
                : percentage > 80
                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                : "bg-gradient-to-r from-[#F38820] via-amber-400 to-[#F38820]"
            )}
            style={{ width: `${Math.min(Math.max(percentage, totalSpent > 0 ? 1.5 : 0), 100)}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>0 VNĐ</span>
          <span>Mốc 50%</span>
          <span>Hạn mức: {formatNumber(totalBudget)} VNĐ</span>
        </div>
      </div>
    </div>
  );
};

const ServiceExecutionSummary = ({ services = [], budgetSummary = null, title = 'Thống kê dịch vụ' }) => {
  const rows = useMemo(() => {
    const grouped = new Map();

    services.forEach((service) => {
      const key = getContractServiceKey(service);
      const existing = grouped.get(key) || {
        key,
        name: getContractServiceName(service),
        quantity: 0,
        active: 0,
        accepted: 0,
        budget: 0,
        spent: 0,
        remaining: 0,
      };

      existing.quantity += 1;
      existing.budget += Number(service.budget || 0);
      if (service.status === 'COMPLETED') {
        existing.accepted += 1;
      } else if (service.status !== 'CANCELLED') {
        existing.active += 1;
      }

      grouped.set(key, existing);
    });

    const serviceBudgets = budgetSummary?.serviceBudgets || [];
    grouped.forEach((row) => {
      let spent = 0;
      serviceBudgets.forEach((sb) => {
        const matchesKey = sb.serviceId && (sb.serviceId === row.key);
        const matchesName = sb.serviceName && row.name && (sb.serviceName.trim().toLowerCase() === row.name.trim().toLowerCase());
        if (matchesKey || matchesName) {
          spent += Number(sb.spent || 0);
        }
      });
      row.spent = spent;
      row.remaining = row.budget - spent;
    });

    return Array.from(grouped.values()).sort((first, second) =>
      serviceSummaryCollator.compare(first.name, second.name)
    );
  }, [services, budgetSummary]);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-extrabold text-slate-900">{title}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">Tổng hợp ngân sách, thực chi và tiến độ từng dịch vụ</p>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm italic text-slate-400">
          Chưa có dịch vụ trong hợp đồng
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-5 py-3">Tên dịch vụ</th>
                <th className="px-3 py-3 text-center">Ngân sách</th>
                <th className="px-3 py-3 text-center">Đã chi</th>
                <th className="px-3 py-3 text-center">Còn lại</th>
                <th className="px-3 py-3 text-center">Số lượng</th>
                <th className="px-3 py-3 text-center">Đang thực thi</th>
                <th className="px-3 py-3 text-center">Đã nghiệm thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const isOver = row.remaining < 0;
                return (
                  <tr key={row.key} className="text-sm hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800">{row.name}</td>
                    <td className="px-3 py-3 text-center font-bold text-blue-600">
                      {formatNumber(row.budget)}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-[#F38820]">
                      {formatNumber(row.spent)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded-lg text-xs font-extrabold",
                        isOver
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : row.remaining > 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "text-slate-500"
                      )}>
                        {formatNumber(row.remaining)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-extrabold text-slate-700">{row.quantity}</td>
                    <td className="px-3 py-3 text-center font-extrabold text-blue-700">{row.active}</td>
                    <td className="px-3 py-3 text-center font-extrabold text-emerald-700">{row.accepted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useGetProjectQuery(id);
  const { data: budgetSummary, isLoading: isLoadingBudget } = useGetProjectBudgetSummaryQuery(id, { skip: !id });
  const { data: pmUsers = [] } = useGetUsersQuery({ role: 'PM' });
  const [assignProject, { isLoading: isAssigningProject }] = useAssignProjectMutation();
  const [confirmProject, { isLoading: isConfirming }] = useConfirmProjectMutation();
  const [syncProjectServiceJobs, { isLoading: isSyncingServiceJobs }] = useSyncProjectServiceJobsMutation();
  const [resumeProject, { isLoading: isResuming }] = useResumeProjectMutation();
  const [isMonthlyWorkModalOpen, setIsMonthlyWorkModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isPauseDirectModalOpen, setIsPauseDirectModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isCloseDirectModalOpen, setIsCloseDirectModalOpen] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState('');
  const [activeTab, setActiveTab] = useState('MAIN');
  const user = useSelector(selectCurrentUser);
  const currentUserId = getCurrentUserId(user);
  const projectManagerMember = project?.team?.members?.find(member => hasTeamMemberRole(member, 'PROJECT_MANAGER'));
  const hasProjectManager = Boolean(projectManagerMember?.user?.id);
  const isAdminOrBOD = ['ADMIN', 'BOD'].includes(user?.role);
  const isProjectLead = isSameUser(project?.team?.teamLead?.id, currentUserId) ||
    isSameUser(project?.team?.teamLeadId, currentUserId);
  const isProjectAccount = isProjectLead || Boolean(project?.team?.members?.some(member =>
    hasTeamMemberRole(member, 'ACCOUNT') && isSameUser(member.user?.id, currentUserId)
  ));
  const isProjectManager = isSameUser(projectManagerMember?.user?.id, currentUserId) ||
    isSameUser(project?.projectManager?.id, currentUserId) ||
    Boolean(project?.team?.members?.some(m => hasTeamMemberRole(m, 'PROJECT_MANAGER') && isSameUser(m.user?.id, currentUserId)));
  // ── Tạm dừng dự án ────────────────────────────────────────────────────
  const showRequestPause = canRequestPause(project, user);
  const showPauseDirect = canPauseDirect(project, user);
  const showResume = canResume(project, user);
  const showCloseDirect = canCloseDirect(project, user);
  const showRequestClose = canRequestClose(project, user);
  const daysLeft = daysUntilAutoClose(project);
  const inReminderWindow = isInReminderWindow(daysLeft);
  const isOnHold = project?.status === PAUSE_STATUS.ON_HOLD;
  const isClosed = ['COMPLETED', 'CANCELLED'].includes(project?.status);
  const isPendingPauseApproval = project?.status === PAUSE_STATUS.PENDING_PAUSE_APPROVAL;
  const showPauseTab = isOnHold || isPendingPauseApproval
    || Boolean(project?.pausedAt) || isAdminOrBOD || isProjectManager;

  const canAssignPm = !isOnHold && !isClosed && (user?.role === 'ADMIN' || user?.role === 'BOD') && !hasProjectManager;
  const canConfirmProject = !isOnHold && !isClosed && project?.status === 'PENDING_CONFIRMATION' &&
    (user?.role === 'ADMIN' || isProjectAccount);
  const canSyncServiceJobs = !isOnHold && !isClosed && (user?.role === 'ADMIN' || user?.role === 'PM') && !isProjectLead;

  const handleResume = async () => {
    try {
      await resumeProject({ id, resumeReason: 'Làm tiếp dự án' }).unwrap();
      toast.success('Đã mở lại dự án — các công việc được khôi phục');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể mở lại dự án');
    }
  };

  const displayedTasks = useMemo(() => {
    if (!Array.isArray(project?.tasks)) return [];
    return project.tasks;
  }, [project?.tasks]);

  const myTasks = useMemo(() => {
    if (!currentUserId) return [];
    return displayedTasks.filter(task =>
      isSameUser(task.assigneeId, currentUserId) ||
      isSameUser(task.assignee?.id, currentUserId)
    );
  }, [displayedTasks, currentUserId]);

  const isCoreMember = isSameUser(project?.team?.teamLead?.id, currentUserId) ||
    project?.team?.members?.some(m => isSameUser(m.user?.id, currentUserId)) ||
    PROJECT_MANAGEMENT_ROLES.includes(user?.role);
  const canCreateProjectWork = user?.role === 'PM' || user?.role === 'ADMIN';


  const handleConfirm = async () => {
    try {
      await confirmProject(id).unwrap();
      toast.success('Chấp nhận dự án thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi chấp nhận dự án');
    }
  };

  const handleAssignPm = async () => {
    if (!selectedPmId) return;
    if (!project?.contract?.id) {
      toast.error('Dự án chưa có hợp đồng để phân công PM');
      return;
    }

    try {
      await assignProject({ contractId: project.contract.id, pmId: selectedPmId }).unwrap();
      toast.success('Đã phân công PM cho dự án');
      setSelectedPmId('');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể phân công PM');
    }
  };

  const handleSyncServiceJobs = async () => {
    try {
      const result = await syncProjectServiceJobs(id).unwrap();
      toast.success(`Đồng bộ xong: tạo ${result.createdContractServices || 0} dịch vụ, cập nhật ${result.updatedContractServices || 0} dịch vụ, tạo ${result.createdTasks || 0} task, cập nhật ${result.updatedOutputTasks || 0} task đầu ra, bổ sung ${result.backfilledResults || 0} kết quả.`);
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi đồng bộ công việc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">Không tìm thấy dự án</p>
        <button
          onClick={() => navigate('/projects')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const extraTasks = project.tasks?.filter((task) => task.isExtra) || [];
  const taskCount = project.tasks?.length || 0;

  return (
    <div className="mx-6 mt-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại danh sách dự án</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${PROJECT_STATUS_COLORS[project.status]}`}>
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-2 max-w-2xl whitespace-pre-wrap">{project.description}</p>
            )}
            {projectManagerMember?.user && (
              <p className="mt-2 text-sm font-medium text-blue-700">
                PM phụ trách: {projectManagerMember.user.fullName}
              </p>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            {canSyncServiceJobs && (
              <button
                onClick={handleSyncServiceJobs}
                disabled={isSyncingServiceJobs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingServiceJobs ? 'animate-spin' : ''}`} />
                <span>{isSyncingServiceJobs ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
              </button>
            )}
            {canConfirmProject && (
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isConfirming ? 'Đang xử lý...' : 'Chấp nhận'}</span>
              </button>
            )}

            {/* Tạm dừng — BOD/ADMIN dừng ngay, PM/BD gửi yêu cầu */}
            {showPauseDirect && (
              <button
                onClick={() => setIsPauseDirectModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 shadow-sm transition-all active:scale-95"
                title="Tạm dừng ngay, không cần duyệt"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Tạm dừng ngay</span>
              </button>
            )}
            {!showPauseDirect && showRequestPause && (
              <button
                onClick={() => setIsPauseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 shadow-sm transition-all active:scale-95"
                title="Gửi yêu cầu tạm dừng để BOD duyệt"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Yêu cầu tạm dừng</span>
              </button>
            )}

            {/* Đóng dự án — BD/BOD/ADMIN đóng ngay, PM gửi đề nghị */}
            {showCloseDirect && (
              <button
                onClick={() => setIsCloseDirectModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-sm transition-all active:scale-95"
                title="Đóng dự án ngay, không cần duyệt"
              >
                <Archive className="w-4 h-4" />
                <span>Đóng dự án</span>
              </button>
            )}
            {!showCloseDirect && showRequestClose && (
              <button
                onClick={() => setIsCloseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-800 shadow-sm transition-all active:scale-95"
                title="Gửi đề nghị đóng dự án để BOD duyệt"
              >
                <Archive className="w-4 h-4" />
                <span>Đề nghị đóng</span>
              </button>
            )}

            {/* Làm tiếp */}
            {showResume && (
              <button
                onClick={handleResume}
                disabled={isResuming}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                title="Mở lại dự án và khôi phục công việc"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{isResuming ? 'Đang xử lý...' : 'Làm tiếp'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner trạng thái tạm dừng */}
        {isOnHold && (
          <div className={cn(
            'mt-4 rounded-2xl border p-4',
            inReminderWindow
              ? 'border-red-200 bg-red-50/70'
              : 'border-amber-200 bg-amber-50/70'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white',
                inReminderWindow ? 'bg-red-600' : 'bg-amber-500'
              )}>
                {inReminderWindow ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-bold',
                  inReminderWindow ? 'text-red-900' : 'text-amber-900'
                )}>
                  Dự án đang tạm dừng
                  {daysLeft !== null && (
                    <> — còn <b>{daysLeft} ngày</b> sẽ tự động đóng</>
                  )}
                </p>
                <div className="mt-1 text-xs font-medium space-y-0.5">
                  {project.autoAcceptAt && (
                    <p className={inReminderWindow ? 'text-red-700' : 'text-amber-700'}>
                      Tự động đóng lúc: <b>{new Date(project.autoAcceptAt).toLocaleString('vi-VN')}</b>
                    </p>
                  )}
                  {project.pausedBy?.fullName && (
                    <p className={inReminderWindow ? 'text-red-700' : 'text-amber-700'}>
                      Người tạm dừng: <b>{project.pausedBy.fullName}</b>
                    </p>
                  )}
                  {inReminderWindow && (
                    <p className="text-red-700 font-semibold">
                      ⚠️ Hệ thống đang gửi thông báo nhắc nhở hằng ngày. Hãy chốt đóng dự án hoặc làm tiếp trước hạn.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner chờ duyệt tạm dừng */}
        {isPendingPauseApproval && (
          <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50/70 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0 text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-yellow-900">Đang chờ BOD duyệt yêu cầu tạm dừng</p>
              <p className="mt-1 text-xs text-yellow-800 font-medium">
                Dự án <b>vẫn đang chạy bình thường</b>. Yêu cầu cần được BOD/ADMIN duyệt ở tab
                {' '}<b>Lịch sử tạm dừng</b>.
              </p>
            </div>
          </div>
        )}

        {canAssignPm && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-blue-700">
                  PM phụ trách
                </label>
                <select
                  value={selectedPmId}
                  onChange={(event) => setSelectedPmId(event.target.value)}
                  className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                >
                  <option value="">{pmUsers.length ? 'Chọn PM cho dự án' : 'Chưa có tài khoản PM'}</option>
                  {pmUsers.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.fullName} - {USER_ROLE.PM}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAssignPm}
                disabled={!selectedPmId || isAssigningProject}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <UserPlus className="h-4 w-4" />
                {isAssigningProject ? 'Đang phân công...' : 'Phân công PM'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="mb-6 flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100/50 p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('MAIN')}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
            activeTab === 'MAIN' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
          )}
        >
          Thông tin chung
        </button>
        <button
          onClick={() => setActiveTab('TASKS')}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
            activeTab === 'TASKS' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
          )}
        >
          Công việc
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
            {displayedTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('MY_TASKS')}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
            activeTab === 'MY_TASKS' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
          )}
        >
          Công việc của tôi
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
            {myTasks.length}
          </span>
        </button>
        {isCoreMember && (
          <button
            onClick={() => setActiveTab('SERVICES')}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
              activeTab === 'SERVICES' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
            )}
          >
            Dịch vụ
          </button>
        )}
        <button
          onClick={() => setActiveTab('EXTRA')}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
            activeTab === 'EXTRA' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
          )}
        >
          Công việc phát sinh
          {extraTasks.length > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] text-orange-700">
              {extraTasks.length}
            </span>
          )}
        </button>
        {showPauseTab && (
          <button
            onClick={() => setActiveTab('PAUSE')}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
              activeTab === 'PAUSE' ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
            )}
          >
            Lịch sử tạm dừng
            {isOnHold && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                ON_HOLD
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === 'MAIN' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <ProjectInfo project={project} formatDate={formatDate} />
            </div>
            <div className="space-y-6">
              <ProjectFinanceWidget budgetSummary={budgetSummary} isLoading={isLoadingBudget} />
              <TeamInfo team={project.team} isOnHold={isOnHold} isClosed={isClosed} project={project} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TASKS' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <TaskStatistics tasks={displayedTasks} />
            <ServiceExecutionSummary services={project.contract?.services || []} budgetSummary={budgetSummary} />
          </div>
          <TaskTable tasks={displayedTasks} project={project} className="min-w-[2000px]" />
        </div>
      )}

      {activeTab === 'MY_TASKS' && (
        <div className="space-y-8">
          <TaskStatistics tasks={myTasks} personalView />
          <TaskTable
            tasks={myTasks}
            project={project}
            bulkAction="start"
            emptyMessage="Bạn chưa được phân công công việc nào trong dự án này"
          />
        </div>
      )}

      {activeTab === 'SERVICES' && isCoreMember && (
        <ContractInfo contract={project.contract} projectId={project.id} project={project} budgetSummary={budgetSummary} />
      )}

      {activeTab === 'EXTRA' && (
        <ExtraTasksSection tasks={project.tasks} />
      )}

      {activeTab === 'PAUSE' && showPauseTab && (
        <PauseHistorySection projectId={project.id} currentUser={user} />
      )}

      <CreateMonthlyWorkModal
        isOpen={isMonthlyWorkModalOpen}
        onClose={() => setIsMonthlyWorkModalOpen(false)}
        projectId={project.id}
      />

      {/* Modals tạm dừng / đóng dự án */}
      <PauseProjectModal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        project={project}
        direct={false}
      />
      <PauseProjectModal
        isOpen={isPauseDirectModalOpen}
        onClose={() => setIsPauseDirectModalOpen(false)}
        project={project}
        direct
      />
      <CloseProjectModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        project={project}
        direct={false}
      />
      <CloseProjectModal
        isOpen={isCloseDirectModalOpen}
        onClose={() => setIsCloseDirectModalOpen(false)}
        project={project}
        direct
      />
    </div >
  );
};

export default ProjectDetailPage;
