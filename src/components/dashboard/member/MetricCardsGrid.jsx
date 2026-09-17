import React from 'react';
import { MetricCard } from './MetricCard';
import { Clock, CheckCircle2, Layers, AlertCircle, RotateCcw, ClipboardCheck, BarChart3, Calendar, FileText, Gauge } from 'lucide-react';
import { ProjectSelector } from '../ProjectSelector';
import { formatWorkloadLabel, getWorkloadColor, getWorkloadDisplayPercent } from '../../../utils/workload';

const WorkloadMetricCard = ({ workload }) => {
    const displayPercent = getWorkloadDisplayPercent(workload);
    const color = getWorkloadColor(displayPercent);
    const pendingVinicoin = Number(workload?.pendingVinicoin || 0);
    const kpi = Number(workload?.kpi || 2500);

    return (
        <div className="relative overflow-hidden rounded-[0.75rem] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
                <div className="mr-4 rounded-lg p-3 text-white" style={{ backgroundColor: color }}>
                    <Gauge size={20} strokeWidth={2.5} />
                </div>
                <div className="flex min-w-0 flex-col items-baseline gap-2 text-left">
                    <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Workload tháng</p>
                    <h3 className="text-2xl font-black tracking-tighter text-slate-900">{formatWorkloadLabel(workload)}</h3>
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(displayPercent, 200) / 2}%`, backgroundColor: color }}
                    />
                </div>
                <p className="truncate text-[10px] font-bold text-slate-400">
                    {pendingVinicoin.toLocaleString()} / {kpi.toLocaleString()} Vinicoin
                </p>
            </div>
        </div>
    );
};

export const MetricCardsGrid = ({
    member,
    projects = [],
    selectedProjectId,
    onSelectProject,
    overdueCount = 0,
    reworkCount = 0,
    pendingCount = 0,
    todayCount = 0,
    totalTasksCount = 0,
    projectMetricOverride,
    userRole,
    isTeamLead,
    isViewingMember = false,
    dashboard,
}) => {
    const statusCounts = member?.statusCounts || {};
    // When isViewingMember is true, we ONLY show the individual member's personal metrics, not roleStats
    const roleStats = !isViewingMember ? member?.roleStats : null;
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const doingVal = roleStats?.doingCount ?? member?.doingCount ?? 0;
    const completedVal = roleStats?.completedCount ?? (Number(statusCounts.COMPLETED || 0) + Number(statusCounts.ACCEPTED || 0) + Number(statusCounts.DONE || 0));
    const overdueVal = roleStats?.overdueCount ?? overdueCount ?? (member?.overdueCount || member?.overdueTasks?.length || 0);

    const reworkVal = roleStats?.reworkCount ?? reworkCount ?? (member?.reworkCount || member?.reworkTasks?.length || 0);
    const pendingVal = roleStats?.pendingCount ?? pendingCount ?? 0;
    const totalTasksVal = roleStats?.totalTasks ?? totalTasksCount ?? (member?.totalTasks || 0);

    // Adaptive Project Metric Label & Count by Role
    let projectLabel = 'Dự án tham gia';
    let projectCount = member?.participatingProjects?.length || 0;

    const isAdminOrBodOrPm = !isViewingMember && (userRole === 'ADMIN' || userRole === 'BOD' || userRole === 'PM');

    if (isAdminOrBodOrPm) {
        projectLabel = 'Dự án hệ thống';
        projectCount = dashboard?.admin?.currentProjects?.length || projects?.length || member?.participatingProjects?.length || 0;
    } else if (!isViewingMember && (isTeamLead || dashboard?.teamLead?.length > 0)) {
        projectLabel = 'Dự án quản lý';
        projectCount = dashboard?.teamLead?.length || projects?.length || member?.participatingProjects?.length || 0;
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm space-y-4">
            {/* Header Toolbar: Title + Integrated Project Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F38820] flex items-center justify-center font-black shrink-0">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                Chỉ số công việc
                            </h3>
                            {selectedProject && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#F38820] truncate max-w-[180px]">
                                    {selectedProject.name}
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-slate-400">
                            {selectedProject
                                ? `Đang lọc dữ liệu theo dự án "${selectedProject.name}"`
                                : 'Tổng quan chỉ số hoạt động theo vai trò của bạn'}
                        </p>
                    </div>
                </div>

                {onSelectProject && (
                    <div className="w-full sm:w-auto min-w-[210px] shrink-0">
                        <ProjectSelector
                            projects={projects}
                            selectedId={selectedProjectId}
                            onSelect={onSelectProject}
                        />
                    </div>
                )}
            </div>

            {/* 8 Task Metric Cards Grid: 4 Columns x 2 Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard
                    title="Đang thực hiện"
                    value={doingVal}
                    icon={Clock}
                    color="blue"
                    sparklineData={[]}
                />

                <MetricCard
                    title="Đã nghiệm thu"
                    value={completedVal}
                    icon={CheckCircle2}
                    color="emerald"
                    sparklineData={[]}
                />

                <MetricCard
                    title="Task quá hạn"
                    value={overdueVal}
                    icon={AlertCircle}
                    color="red"
                    sparklineData={[]}
                />

                <MetricCard
                    title="Cần làm lại"
                    value={reworkVal}
                    icon={RotateCcw}
                    color="amber"
                    sparklineData={[]}
                />

                <MetricCard
                    title="Deadline hôm nay"
                    value={todayCount}
                    icon={Calendar}
                    color="orange"
                    sparklineData={[]}
                />

                {projectMetricOverride || (
                    <MetricCard
                        title="Chờ phê duyệt"
                        value={pendingVal}
                        icon={ClipboardCheck}
                        color="indigo"
                        sparklineData={[]}
                    />
                )}

                <MetricCard
                    title={projectLabel}
                    value={projectCount}
                    icon={Layers}
                    color="purple"
                    sparklineData={[]}
                />

                <WorkloadMetricCard workload={member?.workload} />

                <MetricCard
                    title="Tổng số Task"
                    value={totalTasksVal}
                    icon={FileText}
                    color="sky"
                    sparklineData={[]}
                />
            </div>
        </div>
    );
};



