import React from 'react';
import {
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    FileSignature,
    FileText,
    FolderKanban,
    UserRound,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { PROJECT_STATUS_COLORS } from '../../utils/enums';

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

const SectionPanel = ({ title, count, icon: Icon, accentClass, children }) => (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
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

export const AdminView = ({ dashboard, navigate }) => {
    if (!dashboard?.admin) return null;

    const quotations = dashboard.admin?.approvalQueue?.quotations || [];
    const contracts = dashboard.admin?.approvalQueue?.contracts || [];
    const currentProjects = dashboard.admin?.currentProjects || [];
    const approvalItems = [...quotations, ...contracts]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.4fr)]">
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

            <SectionPanel
                title="Tiến trình dự án hiện tại"
                count={currentProjects.length}
                icon={FolderKanban}
                accentClass="bg-emerald-50 text-emerald-600"
            >
                {currentProjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {currentProjects.map((project) => (
                            <ProjectProgressCard key={project.id} project={project} navigate={navigate} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={FolderKanban}
                        text="Không có dự án hiện tại"
                    />
                )}
            </SectionPanel>
        </div>
    );
};
