import React, { useMemo, useState } from 'react';
import { ArrowUpRight, ClipboardCheck, UserRound } from 'lucide-react';
import { useGetMyNotificationsQuery } from '../../api/notifications';
import { TASK_STATUS } from '../../utils/enums';
import { getTaskDisplayName } from '../../utils/taskName';
import { Modal } from '../ui/Modal';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';

// New Modular Components
import { TodayFocusCard } from './member/TodayFocusCard';
import { MetricCardsGrid } from './member/MetricCardsGrid';
import { ReworkZone } from './member/ReworkZone';
import { TimelineList } from './member/TimelineList';
import { HotProjectList } from './member/HotProjectList';
import { TaskCalendar } from './TaskCalendar';

const ReviewSummaryCard = ({ tasks = [], onOpen }) => (
    <button
        type="button"
        onClick={onOpen}
        className="group relative w-full overflow-hidden rounded-[0.75rem] border border-amber-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-50"
    >
        <div className="mb-3 flex items-start gap-3">
            <div className="mr-4 flex shrink-0 items-center justify-center rounded-lg bg-amber-50 p-3 text-amber-500">
                <ClipboardCheck size={20} strokeWidth={2.5} />
            </div>
            <div className="flex min-w-0 flex-col items-baseline gap-2 text-left">
                <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Việc cần duyệt</p>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900">{tasks.length}</h3>
            </div>
            <ArrowUpRight size={16} className="ml-auto shrink-0 text-slate-300 transition group-hover:text-amber-500" />
        </div>
    </button>
);

const TeamLeadReviewModal = ({ isOpen, onClose, tasks = [], navigate }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Việc cần duyệt" className="max-w-4xl">
        <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
            {tasks.length > 0 ? (
                tasks.map((task) => (
                    <button
                        type="button"
                        key={task.id}
                        onClick={() => {
                            onClose();
                            navigate(`/tasks/${task.id}/review`);
                        }}
                        className="group grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 text-left transition hover:border-amber-100 hover:bg-amber-50/30"
                    >
                        <div className="min-w-0">
                            <div className="mb-1 flex min-w-0 items-center gap-2">
                                <span className="shrink-0 rounded bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-600">
                                    {task.code}
                                </span>
                                <span className="truncate text-[10px] font-bold text-slate-400">
                                    {task.project?.name || 'Dự án nội bộ'}
                                </span>
                            </div>
                            <h4 className="truncate text-sm font-black text-slate-900 group-hover:text-amber-600">
                                {getTaskDisplayName(task)}
                            </h4>
                            <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] font-bold text-slate-500">
                                <UserRound size={13} className="shrink-0 text-slate-300" />
                                <span className="truncate">{task.assignee?.fullName || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-100 transition group-hover:scale-105">
                            <ArrowUpRight size={16} />
                        </div>
                    </button>
                ))
            ) : (
                <p className="py-10 text-center text-xs font-bold uppercase tracking-widest text-slate-300">Không có việc cần duyệt</p>
            )}
        </div>
    </Modal>
);

export const MemberView = ({
    dashboard,
    navigate,
    isViewingMember,
    isTeamLead,
    awaitingReviewTasks,
    user,
    selectedProjectId,
    onSelectProject,
    availableProjects = [],
}) => {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const member = dashboard?.member || {};
    const { data: notifications = [] } = useGetMyNotificationsQuery();

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const rawUpcoming = member?.upcomingDeadlines || [];
        const filteredUpcoming = selectedProjectId
            ? rawUpcoming.filter(task => task.projectId === selectedProjectId || task.project?.id === selectedProjectId)
            : rawUpcoming;

        const todayCount = filteredUpcoming.filter(task =>
            task.deadline && task.deadline.startsWith(todayStr)
        ).length;

        const rawOverdue = member?.overdueTasks || [];
        const filteredOverdue = selectedProjectId
            ? rawOverdue.filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId)
            : rawOverdue;

        const overdueCount = member?.overdueCount !== undefined
            ? (selectedProjectId ? filteredOverdue.length : member.overdueCount)
            : filteredUpcoming.filter(task => task.deadline && new Date(task.deadline) < startOfToday).length;
        const statusCounts = member?.statusCounts || {};
        const completedCount = member?.completedCount ?? (
            Number(statusCounts[TASK_STATUS.COMPLETED] || 0) +
            Number(statusCounts[TASK_STATUS.ACCEPTED] || 0) +
            Number(statusCounts[TASK_STATUS.INTERNAL_COMPLETED] || 0)
        );

        const totalTasks = member?.totalTasks || Object.values(statusCounts).reduce((sum, val) => sum + Number(val || 0), 0);
        const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        return {
            overdue: overdueCount,
            today: todayCount,
            pending: Number(statusCounts[TASK_STATUS.AWAITING_REVIEW] || 0) + Number(statusCounts.WAITING_APPROVAL || 0),
            progress
        };
    }, [member, selectedProjectId]);

    const currentUserId = getCurrentUserId(user);
    const rawTimelineTasks = member?.upcomingDeadlines || [];
    const filteredTimelineTasks = selectedProjectId
        ? rawTimelineTasks.filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId)
        : rawTimelineTasks;
    const timelineTasks = filteredTimelineTasks.slice(0, 10);

    const teamLeadReviewTasks = awaitingReviewTasks?.data?.filter(task =>
        (isSameUser(currentUserId, task.assignerId) || isSameUser(currentUserId, task.project?.team?.teamLead?.id)) &&
        (!selectedProjectId || task.projectId === selectedProjectId || task.project?.id === selectedProjectId)
    ) || [];

    const filteredReworkTasks = selectedProjectId
        ? (member?.reworkTasks || []).filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId)
        : member?.reworkTasks;

    const filteredCalendarTasks = selectedProjectId
        ? (member?.calendarTasks || []).filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId)
        : member?.calendarTasks;

    const shouldReplaceProjectMetric = isTeamLead && !isViewingMember;

    return (
        <>
            <div className="space-y-3 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                    <div className="lg:col-span-7">
                        <TodayFocusCard
                            overdueCount={stats.overdue}
                            todayCount={stats.today}
                            pendingCount={stats.pending}
                            progress={stats.progress}
                            onViewDetail={() => navigate('/tasks')}
                        />
                    </div>
                    <div className="lg:col-span-5 h-fit">
                        <TaskCalendar tasks={filteredCalendarTasks} />
                    </div>
                </div>

                {/* Hàng ngang duy nhất hợp nhất Chỉ số công việc & Ví Vinicoin */}
                <div className="w-full">
                    <MetricCardsGrid
                        member={member}
                        projects={availableProjects}
                        selectedProjectId={selectedProjectId}
                        onSelectProject={onSelectProject}
                        overdueCount={stats.overdue}
                        reworkCount={filteredReworkTasks?.length ?? member?.reworkCount ?? 0}
                        pendingCount={stats.pending}
                        todayCount={stats.today}
                        totalTasksCount={member?.totalTasks || 0}
                        userRole={user?.role || user?.account?.role}
                        isTeamLead={isTeamLead}
                        isViewingMember={isViewingMember}
                        dashboard={dashboard}
                        projectMetricOverride={shouldReplaceProjectMetric ? (
                            <ReviewSummaryCard
                                tasks={teamLeadReviewTasks}
                                onOpen={() => setIsReviewModalOpen(true)}
                            />
                        ) : null}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-stretch">
                    <div className="lg:col-span-3">
                        <ReworkZone tasks={filteredReworkTasks} navigate={navigate} />
                    </div>

                    <div className="lg:col-span-5">
                        <TimelineList tasks={timelineTasks} navigate={navigate} />
                    </div>

                    <div className="lg:col-span-4">
                        <HotProjectList projects={member?.participatingProjects} navigate={navigate} />
                    </div>
                </div>
            </div>

            <TeamLeadReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                tasks={teamLeadReviewTasks}
                navigate={navigate}
            />
        </>
    );
};
