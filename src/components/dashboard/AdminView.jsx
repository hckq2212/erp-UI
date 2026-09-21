import React, { useMemo } from 'react';
import {
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    FileSignature,
    FileText,
    FolderKanban,
    Layers,
    TrendingUp,
    UserRound,
    Users,
    WalletCards,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/format';
import { PROJECT_STATUS_COLORS } from '../../utils/enums';
import { MetricCard } from './member/MetricCard';
import { HotProjectList } from './member/HotProjectList';
import { formatWorkloadLabel, getWorkloadColor, getWorkloadDisplayPercent } from '../../utils/workload';

const PROJECT_STATUS_LABELS = {
    PENDING_CONFIRMATION: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
};

const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

const getProgressTone = (progress = 0) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 45) return 'bg-blue-500';
    if (progress > 0) return 'bg-amber-500';
    return 'bg-slate-300';
};

const formatCompactCurrency = (value = 0) => {
    const amount = Number(value || 0);
    if (!amount) return '0';

    return new Intl.NumberFormat('vi-VN', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount);
};

const AdminFocusCard = ({
    pendingApprovalCount = 0,
    activeProjectCount = 0,
    averageProgress = 0,
    totalDebt = 0,
    onViewApprovals,
}) => (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF6EF] via-[#FFEBE0] to-[#FFDBC4] rounded-[1.25rem] p-5 text-[#1A1A1A] shadow-xl shadow-orange-100/40 border border-[#FFE6D5]">
        <svg className="absolute bottom-0 right-0 w-[550px] h-[350px] pointer-events-none z-0 opacity-80" viewBox="0 0 500 300" fill="none">
            <path d="M0 300C120 230 250 290 500 160V300H0Z" fill="url(#admin-wave-grad)" />
            <defs>
                <linearGradient id="admin-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFEADA" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FFC8A6" stopOpacity="0.6" />
                </linearGradient>
            </defs>
        </svg>
        <svg className="absolute top-0 right-0 w-[280px] h-[180px] pointer-events-none z-0 opacity-40" viewBox="0 0 300 200" fill="none">
            <path d="M80 0C140 70 200 40 300 100V0H80Z" fill="url(#admin-top-wave-grad)" />
            <defs>
                <linearGradient id="admin-top-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2E8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FFE2CD" stopOpacity="0.7" />
                </linearGradient>
            </defs>
        </svg>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 space-y-4">
                <div>
                    <p className="text-[#FF6633] text-[10px] font-black uppercase tracking-[0.2em] mb-2">ADMIN FOCUS</p>
                    <h2 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-[#1A1A1A]">
                        Tập trung để tạo ra<br />những điều khác biệt! 🔥
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={onViewApprovals}
                        className="bg-white rounded-xl p-4 flex items-center gap-3 text-left shadow-md shadow-orange-100/40 border border-orange-50/50 hover:scale-[1.03] transition"
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-500 shadow-inner flex-shrink-0">
                            <ClipboardCheck size={18} />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-[#1A1A1A] leading-tight block">{pendingApprovalCount}</span>
                            <p className="text-[10px] font-bold text-gray-500 leading-tight">Cần phê duyệt</p>
                            <span className="text-[9px] font-bold text-red-500">Xử lý ưu tiên</span>
                        </div>
                    </button>

                    <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-md shadow-orange-100/40 border border-orange-50/50 hover:scale-[1.03] transition">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 shadow-inner flex-shrink-0">
                            <FolderKanban size={18} />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-[#1A1A1A] leading-tight block">{activeProjectCount}</span>
                            <p className="text-[10px] font-bold text-gray-500 leading-tight">Dự án đang chạy</p>
                            <span className="text-[9px] font-bold text-blue-500">Cần bám tiến độ</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-md shadow-orange-100/40 border border-orange-50/50 hover:scale-[1.03] transition">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-500 shadow-inner flex-shrink-0">
                            <WalletCards size={18} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-2xl font-black text-[#1A1A1A] leading-tight block truncate">{formatCompactCurrency(totalDebt)}</span>
                            <p className="text-[10px] font-bold text-gray-500 leading-tight">Công nợ</p>
                            <span className="text-[9px] font-bold text-amber-500">Theo dõi thu hồi</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex lg:col-span-4 justify-center items-center relative z-10">
                <div className="relative w-56 h-56 rounded-full bg-white flex items-center justify-center shadow-xl shadow-orange-100/50 border-4 border-white">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="88" cy="88" r="72" stroke="#FFF3EB" strokeWidth="10" fill="transparent" />
                            <motion.circle
                                cx="88"
                                cy="88"
                                r="72"
                                stroke="#FF511A"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 72}
                                initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - averageProgress / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black tracking-tighter text-[#FF511A]">{averageProgress}%</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tiến độ TB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const AdminMetricCardsGrid = ({ admin, approvalCount, activeProjectCount, averageProgress }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard title="Khách hàng" value={admin?.totalCustomers ?? 0} icon={Users} color="blue" sparklineData={[]} />
        <MetricCard title="Khách hàng mới" value={admin?.newCustomers ?? 0} icon={TrendingUp} color="emerald" sparklineData={[]} />
        <MetricCard title="Cần phê duyệt" value={approvalCount} icon={ClipboardCheck} color="purple" sparklineData={[]} />
        <MetricCard title="Doanh thu" value={formatCompactCurrency(admin?.totalRevenue)} icon={WalletCards} color="orange" sparklineData={[]} />
        <MetricCard title="Dự án đang chạy" value={activeProjectCount} icon={Layers} color="sky" sparklineData={[]} subValue={`${averageProgress}% tiến độ TB`} />
    </div>
);

const SectionPanel = ({ title, count, icon: Icon, accentClass, children }) => (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm h-fit">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="truncate text-base font-black text-slate-900">{title}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                {count}
            </span>
        </div>
        <div className="p-4">{children}</div>
    </section>
);

const EmptyState = ({ icon: Icon, text }) => (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
        <Icon className="mb-3 h-9 w-9 text-slate-300" />
        <p className="text-sm font-bold text-slate-400">{text}</p>
    </div>
);

const StaffWorkloadPanel = ({ workloads = [], onSelectMember }) => {
    const sorted = [...workloads].sort((a, b) => Number(b.percent || 0) - Number(a.percent || 0));

    return (
        <SectionPanel
            title="Workload nhân sự"
            icon={Users}
            accentClass="bg-emerald-50 text-emerald-600"
        >
            {sorted.length > 0 ? (
                <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                    {sorted.map((item) => {
                        const displayPercent = getWorkloadDisplayPercent(item);
                        const color = getWorkloadColor(displayPercent);
                        return (
                            <button
                                key={item.userId}
                                type="button"
                                onClick={() => onSelectMember?.(item.userId)}
                                className="group w-full rounded-lg border border-slate-100 bg-white p-3 text-left transition hover:border-emerald-100 hover:bg-emerald-50/40"
                            >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-700">
                                            {item.fullName}
                                        </h4>
                                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {item.role}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow-sm"
                                        style={{ backgroundColor: color }}
                                    >
                                        {formatWorkloadLabel(item)}
                                    </span>
                                </div>
                                <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(displayPercent, 200) / 2}%`, backgroundColor: color }}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">
                                    {Number(item.pendingVinicoin || 0).toLocaleString()} / {Number(item.kpi || 2500).toLocaleString()} Vinicoin
                                </p>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={Users}
                    text="Chưa có dữ liệu workload nhân sự"
                />
            )}
        </SectionPanel>
    );
};

const ApprovalItem = ({ item, navigate }) => {
    const isQuotation = item.type === 'QUOTATION';
    const Icon = isQuotation ? FileText : FileSignature;
    const targetPath = isQuotation && item.opportunityId
        ? `/opportunities/${item.opportunityId}`
        : `/contracts/${item.id}`;
    const tone = isQuotation
        ? 'border-l-violet-500 bg-violet-50/40 text-violet-700'
        : 'border-l-cyan-500 bg-cyan-50/40 text-cyan-700';

    return (
        <button
            type="button"
            onClick={() => navigate(targetPath)}
            className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-l-4 border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-white hover:shadow-sm ${tone}`}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600 shadow-sm">
                        {isQuotation ? 'Báo giá' : 'Hợp đồng'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{formatDate(item.createdAt)}</span>
                </div>
                <h4 className="truncate text-sm font-black text-slate-900">
                    {isQuotation
                        ? `${item.title} - ${item.opportunityName || 'Cơ hội chưa xác định'}`
                        : `${item.contractCode || ''} ${item.title || ''}`.trim()}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                    <span className="truncate">{item.customerName || 'Chưa có khách hàng'}</span>
                    {item.createdByName && <span className="truncate">{item.createdByName}</span>}
                    <span className="font-black text-slate-800">{formatCurrency(item.totalAmount || 0)}</span>
                </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition group-hover:text-indigo-600">
                <ArrowUpRight className="h-4 w-4" />
            </div>
        </button>
    );
};

const ProjectProgressCard = ({ project, navigate }) => {
    const progress = project.progress || 0;

    return (
        <button
            type="button"
            onClick={() => navigate(`/projects/${project.id}`)}
            className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-slate-900 group-hover:text-indigo-600">
                        {project.name}
                    </h4>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                        {project.customerName || 'Chưa có khách hàng'}
                    </p>
                </div>
                <span className={`shrink-0 rounded border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    {PROJECT_STATUS_LABELS[project.status] || project.status}
                </span>
            </div>

            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tiến độ</span>
                    <span className="text-lg font-black tabular-nums text-slate-900">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full ${getProgressTone(progress)}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 text-xs font-bold text-slate-500 sm:grid-cols-2">
                <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="truncate">{project.completedServiceCount || 0}/{project.serviceCount || 0} đã nghiệm thu</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                    <UserRound className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span className="truncate">{project.teamName || 'Chưa phân đội'}</span>
                </div>
                {(project.plannedStartDate || project.plannedEndDate) && (
                    <div className="flex min-w-0 items-center gap-2 sm:col-span-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">
                            {formatDate(project.plannedStartDate)} - {formatDate(project.plannedEndDate)}
                        </span>
                    </div>
                )}
            </div>
        </button>
    );
};

export const AdminView = ({ dashboard, navigate, onSelectMember }) => {
    const admin = dashboard?.admin || {};
    const quotations = admin?.approvalQueue?.quotations || [];
    const contracts = admin?.approvalQueue?.contracts || [];
    const currentProjects = admin?.currentProjects || [];
    const approvalItems = useMemo(
        () => [...quotations, ...contracts]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
        [quotations, contracts]
    );
    const averageProgress = useMemo(() => {
        if (!currentProjects.length) return 0;
        const totalProgress = currentProjects.reduce((sum, project) => sum + Number(project.progress || 0), 0);
        return Math.round(totalProgress / currentProjects.length);
    }, [currentProjects]);
    const approvalCount = admin?.pendingApprovalCount ?? approvalItems.length;
    const projectProgressItems = currentProjects.map((project) => ({
        ...project,
        clientName: project.customerName,
    }));

    return (
        <div className="space-y-3 pb-20">
            <AdminFocusCard
                pendingApprovalCount={approvalCount}
                activeProjectCount={currentProjects.length}
                averageProgress={averageProgress}
                totalDebt={admin?.totalDebt}
                onViewApprovals={() => navigate('/contracts')}
            />

            <AdminMetricCardsGrid
                admin={admin}
                approvalCount={approvalCount}
                activeProjectCount={currentProjects.length}
                averageProgress={averageProgress}
            />

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(320px,0.8fr)_minmax(320px,0.85fr)_minmax(0,1.3fr)] ">
                <SectionPanel
                    title="Danh sách cần duyệt"
                    count={approvalItems.length}
                    icon={ClipboardCheck}
                    accentClass="bg-indigo-50 text-indigo-600"
                >
                    {approvalItems.length > 0 ? (
                        <div className="space-y-3">
                            {approvalItems.map((item) => (
                                <ApprovalItem key={`${item.type}-${item.id}`} item={item} navigate={navigate} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={ClipboardCheck}
                            text="Không có báo giá hoặc hợp đồng nào đang chờ duyệt"
                        />
                    )}
                </SectionPanel>
                <StaffWorkloadPanel
                    workloads={admin?.staffWorkloads || []}
                    onSelectMember={onSelectMember}
                />
                {currentProjects.length > 0 ? (
                    <HotProjectList
                        projects={projectProgressItems}
                        navigate={navigate}
                        title="Tiến trình dự án hiện tại"
                        subtitle="Tiến độ dự án"
                    />
                ) : (
                    <EmptyState
                        icon={FolderKanban}
                        text="Không có dự án hiện tại"
                    />
                )}
            </div>
        </div>
    );
};
