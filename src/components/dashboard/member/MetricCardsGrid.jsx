import React from 'react';
import { MetricCard } from './MetricCard';
import { Clock, CheckCircle2, AlertCircle, ClipboardCheck, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    onOpenReviewModal,
    projectMetricOverride,
    userRole,
    isTeamLead,
    isViewingMember = false,
    dashboard,
    buildTasksUrl,
}) => {
    const navigate = useNavigate();
    const statusCounts = member?.statusCounts || {};
    const canViewRoleStats = ['ADMIN', 'BOD', 'PM'].includes(userRole);
    const roleStats = !isViewingMember && canViewRoleStats ? member?.roleStats : null;
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const doingVal = roleStats?.doingCount ?? member?.doingCount ?? 0;
    const completedVal = roleStats?.completedCount ?? member?.completedCount ?? (Number(statusCounts.COMPLETED || 0) + Number(statusCounts.ACCEPTED || 0) + Number(statusCounts.INTERNAL_COMPLETED || 0));
    const overdueVal = roleStats?.overdueCount ?? overdueCount ?? (member?.overdueCount || member?.overdueTasks?.length || 0);

    const reworkVal = roleStats?.reworkCount ?? reworkCount ?? (member?.reworkCount || member?.reworkTasks?.length || 0);
    const pendingVal = roleStats?.pendingCount ?? pendingCount ?? 0;

    return (
        <div>
            {/* Single Row 5 Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <MetricCard
                    title="Đang thực hiện"
                    value={doingVal}
                    icon={Clock}
                    color="blue"
                    sparklineData={[]}
                    onClick={() => navigate(buildTasksUrl ? buildTasksUrl({ status: 'DOING' }) : '/tasks?status=DOING')}
                />

                {projectMetricOverride || (
                    <MetricCard
                        title="Việc cần duyệt"
                        value={pendingVal}
                        icon={ClipboardCheck}
                        color="indigo"
                        sparklineData={[]}
                        onClick={onOpenReviewModal || (() => navigate(buildTasksUrl ? buildTasksUrl({ status: 'AWAITING_REVIEW' }) : '/tasks?status=AWAITING_REVIEW'))}
                    />
                )}

                <MetricCard
                    title="Đã nghiệm thu"
                    value={completedVal}
                    icon={CheckCircle2}
                    color="emerald"
                    sparklineData={[]}
                    onClick={() => navigate(buildTasksUrl ? buildTasksUrl({ status: 'COMPLETED', dateType: 'actualEndDate' }) : '/tasks?status=COMPLETED')}
                />

                <MetricCard
                    title="Task quá hạn"
                    value={overdueVal}
                    icon={AlertCircle}
                    color="red"
                    sparklineData={[]}
                    onClick={() => navigate(buildTasksUrl ? buildTasksUrl({ status: 'OVERDUE' }) : '/tasks?status=OVERDUE')}
                />

                <MetricCard
                    title="Cần làm lại"
                    value={reworkVal}
                    icon={RotateCcw}
                    color="amber"
                    sparklineData={[]}
                    onClick={() => navigate(buildTasksUrl ? buildTasksUrl({ status: 'REWORKING' }) : '/tasks?status=REWORKING')}
                />
            </div>
        </div>
    );
};
