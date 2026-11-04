import { useMemo, useState } from 'react';
import { hasTeamMemberRole } from '../../../utils/teamMember';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    Loader2,
    LayoutList,
    ListChecks,
    Package,
    Pencil,
    Save,
    Send,
    AlertTriangle,
    X,
    Wallet,
    Receipt,
    PiggyBank,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { CreateAcceptanceModal } from './CreateAcceptanceModal';
import { useUpdateContractServiceNicknameMutation } from '../../../api/contracts';
import {
    CONTRACT_SERVICE_STATUS_LABELS,
    CONTRACT_SERVICE_STATUS_COLORS,
    TASK_STATUS,
    TASK_STATUS_COLORS,
    TASK_STATUS_LABELS,
} from '../../../utils/enums';
import { getFilePreviewUrl } from '../../../utils/cloudinary';
import { cn } from '../../../utils/cn';
import { getTaskDisplayName } from '../../../utils/taskName';
import { formatCurrency, formatDate, formatNumber } from '../../../utils/format';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/authSlice';
import { getCurrentUserId, isSameUser } from '../../../utils/authUser';

const FILTER_OPTIONS = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'ACTIVE', label: 'Đang làm' },
    { value: 'AWAITING_ACCEPTANCE', label: 'Chờ nghiệm thu' },
    { value: 'ACCEPTANCE_REJECTED', label: 'Bị từ chối' },
    { value: 'COMPLETED', label: 'Hoàn tất' },
];

const RESULT_STATUS_CLASSES = {
    APPROVED: 'border-green-200 bg-green-50 text-green-700',
    REJECTED: 'border-red-200 bg-red-50 text-red-700',
};

const COMPLETED_TASK_STATUSES = new Set([
    TASK_STATUS.COMPLETED,
    TASK_STATUS.ACCEPTED,
    // TASK_STATUS.INTERNAL_COMPLETED,
]);

const ISSUE_TASK_STATUSES = new Set([
    TASK_STATUS.OVERDUE,
    TASK_STATUS.REJECTED,
    TASK_STATUS.AWAITING_PRICING,
]);

const serviceNameCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

const getServiceName = (item) => item.nickname?.trim() || item.name || item.service?.name || `Hạng mục #${item.id}`;
const getServiceOriginalName = (item) => item.name || item.service?.name || '';
const getServiceCode = (item) => item.code || item.service?.code || null;
const getTaskOwner = (task) => task.assignee?.fullName || task.helper?.fullName || task.vendor?.name || task.vendorId || 'Chưa phân công';

const compareServicesByName = (first, second) => {
    const nameDiff = serviceNameCollator.compare(getServiceName(first), getServiceName(second));
    if (nameDiff !== 0) return nameDiff;

    const codeDiff = serviceNameCollator.compare(getServiceCode(first) || '', getServiceCode(second) || '');
    if (codeDiff !== 0) return codeDiff;

    return serviceNameCollator.compare(String(first.id || ''), String(second.id || ''));
};

const ServiceStatusBadge = ({ status }) => (
    <span className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
        CONTRACT_SERVICE_STATUS_COLORS[status] || 'border-gray-100 bg-gray-50 text-gray-600'
    )}>
        {CONTRACT_SERVICE_STATUS_LABELS[status] || status || 'Chưa có trạng thái'}
    </span>
);

const TaskStatusBadge = ({ status }) => (
    <span className={cn(
        'inline-flex rounded-lg border px-2 py-1 text-[10px] font-bold',
        TASK_STATUS_COLORS[status] || 'border-gray-100 bg-gray-50 text-gray-500'
    )}>
        {TASK_STATUS_LABELS[status] || status || 'Chưa có trạng thái'}
    </span>
);

const SummaryCard = ({ label, value, className, icon: Icon }) => (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            {Icon && <Icon className={cn('h-4 w-4 text-gray-300', className)} />}
        </div>
        <p className={cn('mt-1 text-2xl font-black text-gray-900', className)}>{value}</p>
    </div>
);

const FilterChip = ({ option, count, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors',
            active
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
        )}
    >
        <span>{option.label}</span>
        <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px]',
            active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
        )}>
            {count}
        </span>
    </button>
);

const ServiceProgress = ({ tasks }) => {
    const total = tasks.length;
    const completed = tasks.filter((task) => COMPLETED_TASK_STATUSES.has(task.status)).length;
    const issues = tasks.filter((task) => ISSUE_TASK_STATUSES.has(task.status)).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="min-w-[160px]">
            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>Tiến độ</span>
                <span className={issues ? 'text-rose-500' : 'text-gray-500'}>{completed}/{total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                    className={cn('h-full rounded-full', issues ? 'bg-rose-400' : 'bg-emerald-500')}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

const EmptyState = ({ text }) => (
    <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm italic text-gray-500">{text}</p>
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="mb-3 flex items-start gap-2">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 ring-1 ring-gray-100">
            <Icon className="h-4 w-4" />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
    </div>
);

const getTaskPriority = (task) => {
    if (!task.assigneeId && !task.vendorId) return 0;
    if (ISSUE_TASK_STATUSES.has(task.status)) return 1;
    if (!COMPLETED_TASK_STATUSES.has(task.status)) return 2;
    return 3;
};

const TaskRow = ({ task, onOpenTask }) => (
    <button
        type="button"
        onClick={() => onOpenTask(task.id)}
        className="group grid w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50/40 md:grid-cols-[120px_minmax(160px,1fr)_160px_100px_130px_36px] md:items-center"
    >
        <div className="flex items-center gap-2 md:block min-w-0">
            <span className="font-mono text-xs font-bold text-gray-600 block truncate" title={task.code}>
                {task.code || '---'}
            </span>
            {task.isOutput && (
                <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600 md:mt-1 md:inline-block">
                    Đầu ra
                </span>
            )}
        </div>

        <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900" title={getTaskDisplayName(task)}>
                {getTaskDisplayName(task) || 'Chưa có tên công việc'}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 block truncate md:hidden" title={getTaskOwner(task)}>
                {getTaskOwner(task)}
            </p>
        </div>

        <div className="hidden min-w-0 text-xs font-medium text-gray-600 md:block">
            <span className="block truncate" title={getTaskOwner(task)}>
                {getTaskOwner(task)}
            </span>
        </div>

        <div className="hidden min-w-0 text-xs font-medium text-gray-500 md:block">
            <span className="block truncate">
                {task.plannedEndDate ? formatDate(task.plannedEndDate) : '---'}
            </span>
        </div>

        <div className="min-w-0">
            <TaskStatusBadge status={task.status} />
        </div>

        <span className="hidden text-right text-xs font-bold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 md:block">
            Xem
        </span>
    </button>
);

const TaskList = ({ tasks, onOpenTask }) => {
    const sortedTasks = [...tasks].sort((first, second) => {
        const priorityDiff = getTaskPriority(first) - getTaskPriority(second);
        if (priorityDiff !== 0) return priorityDiff;
        return (first.code || '').localeCompare(second.code || '', undefined, { numeric: true });
    });

    return (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                    <div className="hidden border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 md:grid md:grid-cols-[120px_minmax(160px,1fr)_160px_100px_130px_36px] md:items-center gap-3">
                        <span>Mã</span>
                        <span>Công việc</span>
                        <span>Người làm</span>
                        <span>Hạn</span>
                        <span>Trạng thái</span>
                        <span></span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {sortedTasks.map((task) => (
                            <TaskRow key={task.id} task={task} onOpenTask={onOpenTask} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultCard = ({ result, index }) => {
    const resultClassName = RESULT_STATUS_CLASSES[result.status] || 'border-amber-200 bg-amber-50 text-amber-700';
    const content = (
        <div className={cn('flex min-w-0 items-start gap-3 rounded-xl border p-3 transition-colors', resultClassName)}>
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
                <p className="truncate text-xs font-bold">{result?.name || `Kết quả ${index + 1}`}</p>
                {result.status === 'REJECTED' && result.feedback && (
                    <p className="mt-1 text-xs italic text-red-500">Phản hồi: {result.feedback}</p>
                )}
            </div>
        </div>
    );

    if (!result?.url) return content;

    return (
        <a
            href={getFilePreviewUrl(result?.url, result?.type)}
            target="_blank"
            rel="noopener noreferrer"
            className="block min-w-0"
        >
            {content}
        </a>
    );
};

const ServiceDetails = ({ serviceTasks, results, feedback, onOpenTask, canSeeAllTasks = true }) => (
    <div className="mt-4 grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div>
            <SectionHeader
                icon={ListChecks}
                title="Công việc thuộc dịch vụ"
                subtitle={
                    canSeeAllTasks
                        ? `${serviceTasks.length} công việc trong hạng mục này`
                        : `${serviceTasks.length} công việc của bạn trong hạng mục này`
                }
            />
            {serviceTasks.length > 0 ? (
                <TaskList tasks={serviceTasks} onOpenTask={onOpenTask} />
            ) : (
                <p className="text-sm italic text-gray-400">
                    {canSeeAllTasks
                        ? 'Chưa có công việc thuộc dịch vụ'
                        : 'Bạn không có công việc nào trong dịch vụ này'}
                </p>
            )}
        </div>

        <div>
            <SectionHeader
                icon={FileText}
                title="Kết quả"
                subtitle={`${results.length} tài liệu hoặc kết quả đã nộp`}
            />
            {results.length > 0 ? (
                <div className="space-y-2">
                    {results.map((result, index) => (
                        <ResultCard key={index} result={result} index={index} />
                    ))}
                </div>
            ) : (
                <p className="text-sm italic text-gray-400">Chưa có kết quả</p>
            )}
        </div>

        {feedback && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 xl:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Lý do từ chối</p>
                <p className="mt-1 text-sm italic text-red-600">{feedback}</p>
            </div>
        )}
    </div>
);

export const ContractInfo = ({ contract, projectId, project, budgetSummary = null, isClosed: propIsClosed, isOnHold: propIsOnHold, serviceScope = 'regular' }) => {
    const navigate = useNavigate();
    const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedServices, setExpandedServices] = useState({});
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [nicknameDraft, setNicknameDraft] = useState('');
    const [updateContractServiceNickname, { isLoading: isUpdatingNickname }] = useUpdateContractServiceNicknameMutation();
    const allServices = useMemo(() => Array.isArray(contract?.services) ? contract.services : [], [contract?.services]);
    const services = useMemo(() => allServices.filter((item) =>
        (item.addendumInfo?.type === 'ADD_SERVICES') === (serviceScope === 'extra')
    ), [allServices, serviceScope]);
    const totalBudget = useMemo(() => {
        return allServices.reduce((sum, item) => sum + Number(item.budget || 0), 0);
    }, [allServices]);

    const serviceBudgets = useMemo(() => budgetSummary?.serviceBudgets || [], [budgetSummary]);
    const getServiceSpendInfo = (item) => {
        const csId = item.id;
        const csServiceId = item.serviceId || item.service?.id;
        const name = (item.name || item.service?.name || '').trim().toLowerCase();
        let spent = 0;
        serviceBudgets.forEach((sb) => {
            if ((sb.contractServiceId && sb.contractServiceId === csId) ||
                (sb.serviceId && csServiceId && sb.serviceId === csServiceId) ||
                (sb.serviceName && sb.serviceName.trim().toLowerCase() === name)) {
                spent += Number(sb.spent || 0);
            }
        });
        const budget = Number(item.budget || 0);
        return { spent, remaining: budget - spent };
    };

    const user = useSelector(selectCurrentUser);
    const currentUserId = getCurrentUserId(user);

    const projectManagerMember = project?.team?.members?.find((member) => hasTeamMemberRole(member, 'PROJECT_MANAGER'));
    const isProjectLead = isSameUser(project?.team?.teamLead?.id, currentUserId) ||
        isSameUser(project?.team?.teamLeadId, currentUserId);
    const isProjectManager = isSameUser(projectManagerMember?.user?.id, currentUserId) ||
        isSameUser(project?.projectManager?.id, currentUserId) ||
        Boolean(project?.team?.members?.some((m) => hasTeamMemberRole(m, 'PROJECT_MANAGER') && isSameUser(m.user?.id, currentUserId)));
    const isClosed = propIsClosed ?? ['COMPLETED', 'CANCELLED'].includes(project?.status);
    const isOnHold = propIsOnHold ?? (project?.status === 'ON_HOLD' || Boolean(project?.isOnHold));
    const isAdminOrBOD = ['ADMIN', 'BOD'].includes(user?.role);
    const canSeeAllTasks = isAdminOrBOD || isProjectLead || isProjectManager;
    // Khi dự án tạm dừng (ON_HOLD) hoặc đã đóng (COMPLETED/CANCELLED),
    // toàn bộ chức năng gửi nghiệm thu và chỉnh sửa nickname dịch vụ đều bị khóa.
    const canSendAcceptance = !isClosed && !isOnHold && (isAdminOrBOD || isProjectManager || user?.role === 'ADMIN_SALE');
    const canEditServiceNickname = !isClosed && !isOnHold && canSeeAllTasks;

    const projectTasksMap = useMemo(() => {
        const map = new Map();
        if (Array.isArray(project?.tasks)) {
            project.tasks.forEach((t) => map.set(t.id, t));
        }
        return map;
    }, [project?.tasks]);

    const isUserTask = (task) => {
        if (
            isSameUser(currentUserId, task.assigneeId) ||
            isSameUser(currentUserId, task.assignee?.id) ||
            isSameUser(currentUserId, task.helperId) ||
            isSameUser(currentUserId, task.helper?.id)
        ) {
            return true;
        }
        if (Array.isArray(task.subtasks) && task.subtasks.some((st) =>
            isSameUser(currentUserId, st.assigneeId) ||
            isSameUser(currentUserId, st.assignee?.id) ||
            isSameUser(currentUserId, st.helperId) ||
            isSameUser(currentUserId, st.helper?.id)
        )) {
            return true;
        }
        return false;
    };

    const visibleServices = useMemo(() => {
        if (canSeeAllTasks) return services;
        return services.filter((item) => {
            const rawTasks = Array.isArray(item.tasks) ? item.tasks : [];
            const enrichedTasks = rawTasks.map((t) => {
                const full = projectTasksMap.get(t.id);
                return full ? { ...t, ...full } : t;
            });
            const userTasks = enrichedTasks.filter(isUserTask);
            return userTasks.length > 0;
        });
    }, [services, canSeeAllTasks, projectTasksMap, currentUserId]);

    const summary = useMemo(() => ({
        total: visibleServices.length,
        active: visibleServices.filter((service) => service.status === 'ACTIVE').length,
        awaiting: visibleServices.filter((service) => service.status === 'AWAITING_ACCEPTANCE').length,
        rejected: visibleServices.filter((service) => service.status === 'ACCEPTANCE_REJECTED').length,
        completed: visibleServices.filter((service) => service.status === 'COMPLETED').length,
        cancelled: visibleServices.filter((service) => service.status === 'CANCELLED').length,
    }), [visibleServices]);

    const filterCounts = useMemo(() => ({
        ALL: visibleServices.length,
        ACTIVE: summary.active,
        AWAITING_ACCEPTANCE: summary.awaiting,
        ACCEPTANCE_REJECTED: summary.rejected,
        COMPLETED: summary.completed,
    }), [visibleServices.length, summary]);

    const groupedServices = useMemo(() => {
        const filtered = statusFilter === 'ALL'
            ? visibleServices
            : visibleServices.filter((service) => service.status === statusFilter);

        return [...filtered].sort(compareServicesByName).reduce((acc, item) => {
            const groupKey = item.packageName || 'Dịch vụ lẻ';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(item);
            return acc;
        }, {});
    }, [visibleServices, statusFilter]);

    const groupEntries = Object.entries(groupedServices);

    const toggleGroup = (groupName) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupName]: !(prev[groupName] ?? true),
        }));
    };

    const toggleService = (serviceId) => {
        setExpandedServices((prev) => ({
            ...prev,
            [serviceId]: !prev[serviceId],
        }));
    };

    const startEditServiceNickname = (service) => {
        if (isClosed) {
            toast.warning('Dự án đã đóng hoặc hoàn tất, không thể sửa tên dịch vụ.');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng, không thể sửa tên dịch vụ.');
            return;
        }
        setEditingServiceId(service.id);
        setNicknameDraft(service.nickname || '');
    };

    const cancelEditServiceNickname = () => {
        setEditingServiceId(null);
        setNicknameDraft('');
    };

    const saveServiceNickname = async (service) => {
        if (isClosed) {
            toast.warning('Dự án đã đóng hoặc hoàn tất, không thể sửa tên dịch vụ.');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng, không thể sửa tên dịch vụ.');
            return;
        }
        try {
            await updateContractServiceNickname({
                id: service.id,
                nickname: nicknameDraft,
                contractId: contract?.id,
                projectId,
            }).unwrap();
            toast.success('Đã cập nhật nickname hạng mục dịch vụ');
            cancelEditServiceNickname();
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể cập nhật nickname hạng mục dịch vụ');
        }
    };

    if (!contract) return null;

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="space-y-6">
                {/* Banner trạng thái Read-Only khi Dự án Tạm dừng hoặc Đã đóng */}
                {isOnHold && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 flex items-start gap-3 shadow-xs">
                        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 text-white shadow-xs">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-amber-900 text-sm">Dự án đang tạm dừng (ON_HOLD)</p>
                            <p className="mt-0.5 text-xs text-amber-800 font-medium">
                                Toàn bộ chức năng gửi nghiệm thu và chỉnh sửa dịch vụ tạm khóa ở chế độ <b>Chỉ đọc (Read-only)</b> cho đến khi dự án được mở lại.
                            </p>
                        </div>
                    </div>
                )}

                {isClosed && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 flex items-start gap-3 shadow-xs">
                        <div className="w-9 h-9 rounded-lg bg-slate-500 flex items-center justify-center shrink-0 text-white shadow-xs">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm">Dự án đã đóng hoặc hoàn tất ({project?.status})</p>
                            <p className="mt-0.5 text-xs text-slate-600 font-medium">
                                Hạng mục dịch vụ và kết quả đang được lưu trữ ở chế độ <b>Chỉ đọc (Read-only)</b>. Không thể gửi thêm nghiệm thu hoặc chỉnh sửa.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <LayoutList className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-lg font-bold text-gray-900">{serviceScope === 'extra' ? 'Dịch vụ phát sinh' : 'Hạng mục dịch vụ'}</h2>
                                <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    Tổng ngân sách dự án: {formatNumber(totalBudget)} VNĐ
                                </span>
                                {budgetSummary && (
                                    <>
                                        <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-[#F38820]">
                                            Dự án đã chi: {formatNumber(budgetSummary.totalProjectSpent || 0)} VNĐ
                                        </span>
                                        <span className={cn(
                                            "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold",
                                            (budgetSummary.remainingProjectBudget ?? (totalBudget - (budgetSummary.totalProjectSpent || 0))) < 0
                                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        )}>
                                            Ngân sách dự án còn lại: {formatNumber(budgetSummary.remainingProjectBudget ?? (totalBudget - (budgetSummary.totalProjectSpent || 0)))} VNĐ
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Xem nhanh trạng thái nghiệm thu, tiến độ công việc và kết quả theo từng gói.</p>
                        </div>
                    </div>

                    {canSendAcceptance && (
                        <button
                            onClick={() => setIsAcceptanceModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
                        >
                            <Send className="h-4 w-4" />
                            Gửi nghiệm thu
                        </button>
                    )}
                </div>


                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <SummaryCard label="Tổng" value={summary.total} icon={LayoutList} />
                    <SummaryCard label="Đang làm" value={summary.active} className="text-blue-700" icon={Clock} />
                    <SummaryCard label="Chờ nghiệm thu" value={summary.awaiting} className="text-amber-700" icon={FileText} />
                    <SummaryCard label="Bị từ chối" value={summary.rejected} className="text-red-700" icon={AlertTriangle} />
                    <SummaryCard label="Hoàn tất" value={summary.completed} className="text-emerald-700" icon={CheckCircle2} />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {FILTER_OPTIONS.map((option) => (
                        <FilterChip
                            key={option.value}
                            option={option}
                            count={filterCounts[option.value] || 0}
                            active={statusFilter === option.value}
                            onClick={() => setStatusFilter(option.value)}
                        />
                    ))}
                </div>

                {visibleServices.length === 0 ? (
                    <EmptyState
                        text={
                            canSeeAllTasks
                                ? (serviceScope === 'extra' ? 'Chưa có dịch vụ phát sinh' : 'Chưa có hạng mục dịch vụ')
                                : 'Bạn không có công việc nào trong các hạng mục dịch vụ của dự án'
                        }
                    />
                ) : groupEntries.length === 0 ? (
                    <EmptyState text="Không có dịch vụ phù hợp bộ lọc" />
                ) : (
                    <div className="space-y-4">
                        {groupEntries.map(([groupName, items]) => {
                            const isGroupOpen = expandedGroups[groupName] ?? true;
                            const groupStatusCount = items.reduce((acc, item) => {
                                acc[item.status] = (acc[item.status] || 0) + 1;
                                return acc;
                            }, {});

                            return (
                                <div key={groupName} className="overflow-hidden rounded-2xl border border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(groupName)}
                                        className="flex w-full items-center justify-between gap-4 bg-gray-50 px-5 py-4 text-left transition-colors hover:bg-gray-100/70"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                                {isGroupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 shrink-0 text-blue-500" />
                                                    <h3 className="truncate font-bold text-gray-900">{groupName}</h3>
                                                </div>
                                                <p className="mt-1 text-xs font-semibold text-gray-400">
                                                    {items.length} dịch vụ
                                                    {groupStatusCount.AWAITING_ACCEPTANCE ? ` - ${groupStatusCount.AWAITING_ACCEPTANCE} chờ nghiệm thu` : ''}
                                                    {groupStatusCount.ACCEPTANCE_REJECTED ? ` - ${groupStatusCount.ACCEPTANCE_REJECTED} bị từ chối` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    {isGroupOpen && (
                                        <div className="divide-y divide-gray-100 bg-white">
                                            {items.map((item) => {
                                                const rawTasks = Array.isArray(item.tasks) ? item.tasks : [];
                                                const enrichedTasks = rawTasks.map((t) => {
                                                    const full = projectTasksMap.get(t.id);
                                                    return full ? { ...t, ...full } : t;
                                                });
                                                const serviceTasks = canSeeAllTasks
                                                    ? enrichedTasks
                                                    : enrichedTasks.filter(isUserTask);
                                                const itemSpendInfo = getServiceSpendInfo(item);
                                                const results = Array.isArray(item.results) ? item.results : [];
                                                const serviceCode = getServiceCode(item);
                                                const serviceName = getServiceName(item);
                                                const originalServiceName = getServiceOriginalName(item);
                                                const isServiceOpen = Boolean(expandedServices[item.id]);
                                                const isEditingNickname = editingServiceId === item.id;
                                                const hasDetails = serviceTasks.length > 0 || results.length > 0 || item.feedback;

                                                return (
                                                    <div key={item.id} className="px-5 py-4">
                                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => hasDetails && toggleService(item.id)}
                                                                    className={cn(
                                                                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500',
                                                                        hasDetails ? 'hover:bg-blue-50 hover:text-blue-600' : 'cursor-default'
                                                                    )}
                                                                    disabled={!hasDetails}
                                                                    aria-label={isServiceOpen ? 'Thu gọn hạng mục' : 'Mở chi tiết hạng mục'}
                                                                >
                                                                    {hasDetails && (isServiceOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                                                                </button>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {item.addendumInfo?.type === 'ADD_SERVICES' && (
                                                                            <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700" title={item.addendumInfo.name}>
                                                                                Dịch vụ phát sinh
                                                                            </span>
                                                                        )}
                                                                        {serviceCode && (
                                                                            <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-black text-blue-700">
                                                                                {serviceCode}
                                                                            </span>
                                                                        )}
                                                                        {isEditingNickname ? (
                                                                            <input
                                                                                value={nicknameDraft}
                                                                                onChange={(event) => setNicknameDraft(event.target.value)}
                                                                                onKeyDown={(event) => {
                                                                                    if (event.key === 'Enter') saveServiceNickname(item);
                                                                                    if (event.key === 'Escape') cancelEditServiceNickname();
                                                                                }}
                                                                                maxLength={120}
                                                                                autoFocus
                                                                                placeholder={originalServiceName || 'Nickname hạng mục'}
                                                                                className="min-w-[220px] flex-1 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-bold text-gray-900 outline-none ring-2 ring-blue-50 focus:border-blue-400"
                                                                            />
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => hasDetails && toggleService(item.id)}
                                                                                className={cn(
                                                                                    'min-w-0 text-left font-bold text-gray-900',
                                                                                    hasDetails && 'hover:text-blue-700'
                                                                                )}
                                                                            >
                                                                                <span className="block truncate" title={serviceName}>{serviceName}</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-400">
                                                                        {item.addendumInfo?.type === 'ADD_SERVICES' && item.addendumInfo.name && <span>Phụ lục: {item.addendumInfo.name}</span>}
                                                                        <span>
                                                                            {canSeeAllTasks
                                                                                ? `${serviceTasks.length} công việc`
                                                                                : `${serviceTasks.length} công việc của bạn`}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>{results.length} kết quả</span>
                                                                        {item.nickname?.trim() && originalServiceName && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span title={originalServiceName} className="italic text-slate-400">Gốc: {originalServiceName}</span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    <div className="mt-2.5 flex flex-wrap gap-4 text-xs">
                                                                        <div><span className="text-gray-500">Giá vốn (gồm ngân sách): </span><strong className="text-gray-800">{item.pricingCost == null ? 'Chưa có dữ liệu' : formatCurrency(item.pricingCost)}</strong></div>
                                                                        <div><span className="text-gray-500">Giá bán: </span><strong className="text-gray-800">{item.sellingPrice == null ? 'Chưa có dữ liệu' : formatCurrency(item.sellingPrice)}</strong></div>
                                                                    </div>
                                                                    {/* Hàng chỉ số tài chính dịch vụ */}
                                                                    {item.service?.isBudget === true && (
                                                                    <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/70 px-2.5 py-1 text-xs font-semibold text-blue-800">
                                                                            <Wallet className="h-3.5 w-3.5 text-blue-600" />
                                                                            <span>Ngân sách:</span>
                                                                            <b className="font-bold text-blue-900">{formatNumber(item.budget || 0)} VNĐ</b>
                                                                        </span>
                                                                        {budgetSummary && (
                                                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50/70 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                                                                <Receipt className="h-3.5 w-3.5 text-[#F38820]" />
                                                                                <span>Đã chi:</span>
                                                                                <b className="font-bold text-[#F38820]">{formatNumber(itemSpendInfo.spent)} VNĐ</b>
                                                                            </span>
                                                                        )}
                                                                        {budgetSummary && Number(item.budget || 0) > 0 && (
                                                                            <span className={cn(
                                                                                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold",
                                                                                itemSpendInfo.remaining < 0
                                                                                    ? "border-rose-200 bg-rose-50 text-rose-800"
                                                                                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                                            )}>
                                                                                <PiggyBank className={cn("h-3.5 w-3.5", itemSpendInfo.remaining < 0 ? "text-rose-600" : "text-emerald-600")} />
                                                                                <span>Còn lại:</span>
                                                                                <b className={cn("font-bold", itemSpendInfo.remaining < 0 ? "text-rose-700" : "text-emerald-700")}>
                                                                                    {formatNumber(itemSpendInfo.remaining)} VNĐ
                                                                                </b>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    )}
                                                                    
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                                                                <ServiceProgress tasks={serviceTasks} />
                                                                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                                                                    <ServiceStatusBadge status={item.status} />
                                                                    {canEditServiceNickname && (
                                                                        isEditingNickname ? (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => saveServiceNickname(item)}
                                                                                    disabled={isUpdatingNickname}
                                                                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                                >
                                                                                    {isUpdatingNickname ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                                                    Lưu
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={cancelEditServiceNickname}
                                                                                    disabled={isUpdatingNickname}
                                                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                                >
                                                                                    <X className="h-3.5 w-3.5" />
                                                                                    Hủy
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => startEditServiceNickname(item)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                                                            >
                                                                                <Pencil className="h-3.5 w-3.5" />
                                                                                Sửa tên
                                                                            </button>
                                                                        )
                                                                    )}
                                                                    {hasDetails && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleService(item.id)}
                                                                            className="rounded-lg border border-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                                                        >
                                                                            {isServiceOpen ? 'Thu gọn' : 'Chi tiết'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isServiceOpen && (
                                                            <ServiceDetails
                                                                serviceTasks={serviceTasks}
                                                                results={results}
                                                                feedback={item.status === 'ACCEPTANCE_REJECTED' ? item.feedback : null}
                                                                onOpenTask={(taskId) => navigate(`/tasks/${taskId}`)}
                                                                canSeeAllTasks={canSeeAllTasks}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <CreateAcceptanceModal
                isOpen={isAcceptanceModalOpen}
                onClose={() => setIsAcceptanceModalOpen(false)}
                contract={contract}
                projectId={projectId}
                project={project}
            />
        </div>
    );
};
