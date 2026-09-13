import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    LayoutList,
    ListChecks,
    Package,
    Send,
    AlertTriangle,
} from 'lucide-react';
import { CreateAcceptanceModal } from './CreateAcceptanceModal';
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
import { formatDate } from '../../../utils/format';

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
    TASK_STATUS.DONE,
    TASK_STATUS.COMPLETED,
    TASK_STATUS.ACCEPTED,
    TASK_STATUS.INTERNAL_COMPLETED,
]);

const ISSUE_TASK_STATUSES = new Set([
    TASK_STATUS.OVERDUE,
    TASK_STATUS.REJECTED,
    TASK_STATUS.AWAITING_PRICING,
]);

const getServiceName = (item) => item.name || item.service?.name || `Hạng mục #${item.id}`;
const getTaskOwner = (task) => task.assignee?.fullName || task.helper?.fullName || task.vendor?.name || task.vendorId || 'Chưa phân công';

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
        className="group grid w-full gap-2 px-3 py-3 text-left transition-colors hover:bg-blue-50/40 md:grid-cols-[92px_minmax(0,1fr)_128px_92px_128px_42px] md:items-center"
    >
        <div className="flex items-center gap-2 md:block">
            <span className="font-mono text-xs font-bold text-gray-500">{task.code || '---'}</span>
            {task.isOutput && <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600 md:mt-1 md:inline-block">Đầu ra</span>}
        </div>

        <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">
                {getTaskDisplayName(task) || 'Chưa có tên công việc'}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 md:hidden">{getTaskOwner(task)}</p>
        </div>

        <div className="hidden min-w-0 text-xs font-medium text-gray-500 md:block">
            <span className="truncate">{getTaskOwner(task)}</span>
        </div>

        <div className="hidden text-xs font-medium text-gray-500 md:block">
            {task.plannedEndDate ? formatDate(task.plannedEndDate) : '---'}
        </div>

        <div>
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
            <div className="hidden border-b border-gray-100 bg-gray-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 md:grid md:grid-cols-[92px_minmax(0,1fr)_128px_92px_128px_42px]">
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

const ServiceDetails = ({ serviceTasks, results, feedback, onOpenTask }) => (
    <div className="mt-4 grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div>
            <SectionHeader
                icon={ListChecks}
                title="Công việc thuộc dịch vụ"
                subtitle={`${serviceTasks.length} công việc trong hạng mục này`}
            />
            {serviceTasks.length > 0 ? (
                <TaskList tasks={serviceTasks} onOpenTask={onOpenTask} />
            ) : (
                <p className="text-sm italic text-gray-400">Chưa có công việc thuộc dịch vụ</p>
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

export const ContractInfo = ({ contract, projectId }) => {
    const navigate = useNavigate();
    const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedServices, setExpandedServices] = useState({});
    const services = Array.isArray(contract?.services) ? contract.services : [];

    const summary = useMemo(() => ({
        total: services.length,
        active: services.filter((service) => service.status === 'ACTIVE').length,
        awaiting: services.filter((service) => service.status === 'AWAITING_ACCEPTANCE').length,
        rejected: services.filter((service) => service.status === 'ACCEPTANCE_REJECTED').length,
        completed: services.filter((service) => service.status === 'COMPLETED').length,
        cancelled: services.filter((service) => service.status === 'CANCELLED').length,
    }), [services]);

    const filterCounts = useMemo(() => ({
        ALL: services.length,
        ACTIVE: summary.active,
        AWAITING_ACCEPTANCE: summary.awaiting,
        ACCEPTANCE_REJECTED: summary.rejected,
        COMPLETED: summary.completed,
    }), [services.length, summary]);

    const groupedServices = useMemo(() => {
        const filtered = statusFilter === 'ALL'
            ? services
            : services.filter((service) => service.status === statusFilter);

        return filtered.reduce((acc, item) => {
            const groupKey = item.packageName || 'Dịch vụ lẻ';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(item);
            return acc;
        }, {});
    }, [services, statusFilter]);

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

    if (!contract) return null;

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <LayoutList className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Hạng mục dịch vụ</h2>
                            <p className="mt-1 text-sm text-gray-500">Xem nhanh trạng thái nghiệm thu, tiến độ công việc và kết quả theo từng gói.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAcceptanceModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
                    >
                        <Send className="h-4 w-4" />
                        Gửi nghiệm thu
                    </button>
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

                {services.length === 0 ? (
                    <EmptyState text="Chưa có hạng mục dịch vụ" />
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
                                                const serviceTasks = Array.isArray(item.tasks) ? item.tasks : [];
                                                const results = Array.isArray(item.results) ? item.results : [];
                                                const isServiceOpen = Boolean(expandedServices[item.id]);
                                                const hasDetails = serviceTasks.length > 0 || results.length > 0 || item.feedback;

                                                return (
                                                    <div key={item.id} className="px-5 py-4">
                                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                                            <button
                                                                type="button"
                                                                onClick={() => hasDetails && toggleService(item.id)}
                                                                className={cn(
                                                                    'flex min-w-0 flex-1 items-start gap-3 text-left',
                                                                    hasDetails ? 'cursor-pointer' : 'cursor-default'
                                                                )}
                                                            >
                                                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                                                                    {hasDetails && (isServiceOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-bold text-gray-900">{getServiceName(item)}</h4>
                                                                    <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-gray-400">
                                                                        <span>{serviceTasks.length} công việc</span>
                                                                        <span>{results.length} kết quả</span>
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                                                                <ServiceProgress tasks={serviceTasks} />
                                                                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                                                                    <ServiceStatusBadge status={item.status} />
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
            />
        </div>
    );
};
