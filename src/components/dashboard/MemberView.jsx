import React, { useMemo, useState, useCallback } from 'react';
import { format, isSameDay } from 'date-fns';
import { ArrowUpRight, ClipboardCheck, UserRound } from 'lucide-react';
import { useGetMyNotificationsQuery } from '../../api/notifications';
import { TASK_STATUS, PROJECT_MANAGEMENT_ROLES } from '../../utils/enums';
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
import { PMOperationsHub } from './pm/PMOperationsHub';

const TeamLeadReviewModal = ({ isOpen, onClose, tasks = [], navigate }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Việc cần duyệt" className="max-w-4xl">
        <div className="space-y-3">
            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => {
                                onClose();
                                navigate(`/tasks/${task.id}/review`);
                            }}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10"
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-600 border border-amber-100 tracking-tight">
                                    {task.code}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[240px]">
                                    {task.project?.name || 'Dự án nội bộ'}
                                </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-4">
                                {getTaskDisplayName(task)}
                            </h4>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-white shadow-sm shrink-0 uppercase">
                                        {task.assignee?.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Thành viên</p>
                                        <p className="text-xs font-bold text-slate-800 truncate">{task.assignee?.fullName || 'N/A'}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform shrink-0"
                                >
                                    <ArrowUpRight size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Không có việc cần duyệt</p>
                    </div>
                )}
            </div>
        </div>
    </Modal>
);

export const MemberView = ({
    dashboard,
    navigate,
    isViewingMember,
    isAccountViewingMember = false,
    isTeamLead,
    awaitingReviewTasks,
    user,
    selectedMemberId,
    selectedProjectId,
    onSelectProject,
    availableProjects = [],
    selectedDate,
    viewMode = 'overview',
    teamMembers = [],
    onSelectMember
}) => {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const member = dashboard?.member || {};
    const userRole = user?.role || user?.account?.role;
    const isManagementOrAdmin = ['ADMIN', 'BOD', 'PM'].includes(userRole);
    const isPM = userRole === 'PM';
    const isPMOverview = isPM && !isViewingMember && viewMode === 'overview';
    const hideLowerSection = isAccountViewingMember ||
                             Boolean(dashboard?.scope?.isAccountViewingMember) ||
                             (isViewingMember && !isManagementOrAdmin);
    const { data: notifications = [] } = useGetMyNotificationsQuery();
    const currentUserId = getCurrentUserId(user);

    const canManageProjectTasks = PROJECT_MANAGEMENT_ROLES.includes(user?.role);
    const teamLeadReviewTasks = useMemo(() => {
        return awaitingReviewTasks?.data?.filter(task => {
            const matchesRole = canManageProjectTasks || isSameUser(currentUserId, task.assignerId) || isSameUser(currentUserId, task.project?.team?.teamLead?.id);
            const matchesProject = !selectedProjectId || task.projectId === selectedProjectId || task.project?.id === selectedProjectId;

            let matchesDate = true;
            const startM = selectedDate?.startMonth || selectedDate?.month;
            const endM = selectedDate?.endMonth || selectedDate?.month;
            const targetYear = selectedDate?.year;

            if (startM && endM && targetYear) {
                const targetDateStr = task.plannedEndDate || task.actualEndDate || task.createdAt;
                if (targetDateStr) {
                    const d = new Date(targetDateStr);
                    const taskMonth = d.getMonth() + 1;
                    const taskYear = d.getFullYear();
                    matchesDate = (taskYear === targetYear) && (taskMonth >= startM && taskMonth <= endM);
                }
            }

            return matchesRole && matchesProject && matchesDate;
        }) || [];
    }, [awaitingReviewTasks, canManageProjectTasks, currentUserId, selectedProjectId, selectedDate]);

    const rawOverdue = member?.overdueTasks;
    const filteredOverdueTasks = useMemo(() => {
        if (!rawOverdue) return [];
        if (!selectedProjectId) return rawOverdue;
        return rawOverdue.filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId);
    }, [rawOverdue, selectedProjectId]);

    const rawUpcoming = member?.upcomingDeadlines;
    const filteredUpcomingTasks = useMemo(() => {
        if (!rawUpcoming) return [];
        if (!selectedProjectId) return rawUpcoming;
        return rawUpcoming.filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId);
    }, [rawUpcoming, selectedProjectId]);

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const todayCount = filteredUpcomingTasks.filter(task =>
            task.deadline && task.deadline.startsWith(todayStr)
        ).length;

        const overdueCount = member?.overdueCount !== undefined
            ? (selectedProjectId ? filteredOverdueTasks.length : member.overdueCount)
            : filteredUpcomingTasks.filter(task => task.deadline && new Date(task.deadline) < startOfToday).length;
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
            pending: teamLeadReviewTasks.length,
            progress
        };
    }, [member, selectedProjectId, teamLeadReviewTasks, filteredOverdueTasks, filteredUpcomingTasks]);

    const timelineTasks = filteredUpcomingTasks;

    const rawRework = member?.reworkTasks;
    const filteredReworkTasks = useMemo(() => {
        if (!rawRework) return [];
        if (!selectedProjectId) return rawRework;
        return rawRework.filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId);
    }, [rawRework, selectedProjectId]);

    const rawCalendar = member?.calendarTasks;
    const filteredCalendarTasks = useMemo(() => {
        if (!rawCalendar) return [];
        if (!selectedProjectId) return rawCalendar;
        return rawCalendar.filter(t => t.projectId === selectedProjectId || t.project?.id === selectedProjectId);
    }, [rawCalendar, selectedProjectId]);

    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

    const isSelectedDayToday = useMemo(() => {
        return isSameDay(selectedCalendarDate || new Date(), new Date());
    }, [selectedCalendarDate]);

    const selectedDayKey = useMemo(() => {
        return format(selectedCalendarDate || new Date(), 'yyyy-MM-dd');
    }, [selectedCalendarDate]);

    const selectedDayTasks = useMemo(() => {
        return (filteredCalendarTasks || []).filter(task => {
            const dateStr = task.deadline || task.end || task.start;
            if (!dateStr) return false;
            return format(new Date(dateStr), 'yyyy-MM-dd') === selectedDayKey;
        });
    }, [filteredCalendarTasks, selectedDayKey]);

    const isPersonalMode = viewMode === 'personal' || (!isManagementOrAdmin && !isTeamLead);

    const effectiveAssigneeId = isViewingMember
        ? (selectedMemberId || member?.id || '')
        : (isPersonalMode ? (currentUserId || user?.id || member?.id || '') : '');

    const now = new Date();
    const hasMonthFilter = Boolean(selectedDate?.month || selectedDate?.startMonth);
    const startM = selectedDate?.startMonth || selectedDate?.month || (now.getMonth() + 1);
    const endM = selectedDate?.endMonth || selectedDate?.month || (now.getMonth() + 1);
    const targetYear = selectedDate?.year ?? now.getFullYear();
    const startOfMonthStr = format(new Date(targetYear, startM - 1, 1), 'yyyy-MM-dd');
    const endOfMonthStr = format(new Date(targetYear, endM, 0), 'yyyy-MM-dd');

    const buildTasksUrl = useCallback(({
        status,
        dateType,
        deadline,
        deadlineFrom,
        deadlineTo,
        sortBy,
        sortDir,
        includeMonth = true
    } = {}) => {
        const params = new URLSearchParams();
        if (status && status !== 'ALL') params.set('status', status);
        if (effectiveAssigneeId) params.set('assigneeId', effectiveAssigneeId);
        if (selectedProjectId) params.set('projectId', selectedProjectId);
        if (dateType && dateType !== 'plannedEndDate') params.set('dateType', dateType);

        if (deadline) {
            params.set('deadline', deadline);
        } else if (deadlineFrom || deadlineTo) {
            if (deadlineFrom) params.set('deadlineFrom', deadlineFrom);
            if (deadlineTo) params.set('deadlineTo', deadlineTo);
        } else if (includeMonth && hasMonthFilter) {
            params.set('deadlineFrom', startOfMonthStr);
            params.set('deadlineTo', endOfMonthStr);
        }

        if (sortBy) params.set('sortBy', sortBy);
        if (sortDir) params.set('sortDir', sortDir);

        return `/tasks?${params.toString()}`;
    }, [effectiveAssigneeId, selectedProjectId, startOfMonthStr, endOfMonthStr]);

    const activeSelectedDayCount = isSelectedDayToday ? stats.today : selectedDayTasks.length;

    return (
        <>
            <div className="space-y-3 pb-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                    <div className="lg:col-span-7">
                        {isPMOverview ? (
                            <PMOperationsHub
                                reviewTasks={teamLeadReviewTasks}
                                overdueTasks={filteredOverdueTasks}
                                reworkTasks={filteredReworkTasks}
                                workloads={dashboard?.staffWorkloads || dashboard?.admin?.staffWorkloads}
                                teamMembers={teamMembers}
                                navigate={navigate}
                                onSelectMember={onSelectMember}
                            />
                        ) : (
                            <TodayFocusCard
                                overdueCount={stats.overdue}
                                todayCount={activeSelectedDayCount}
                                pendingCount={stats.pending}
                                progress={stats.progress}
                                selectedDate={selectedCalendarDate}
                                isToday={isSelectedDayToday}
                                onResetToday={() => setSelectedCalendarDate(new Date())}
                                onViewDetail={() => navigate(buildTasksUrl({ includeMonth: false }))}
                                buildTasksUrl={buildTasksUrl}
                            />
                        )}
                    </div>
                    <div className="lg:col-span-5 min-h-0">
                        <TaskCalendar
                            tasks={filteredCalendarTasks}
                            selectedDate={selectedCalendarDate}
                            onSelectDate={setSelectedCalendarDate}
                            buildTasksUrl={buildTasksUrl}
                        />
                    </div>
                </div>

                {/* Ẩn toàn bộ phần dưới lịch khi Account đang xem Dashboard của member */}
                {!hideLowerSection && (
                    <>
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
                                viewMode={viewMode}
                                dashboard={dashboard}
                                buildTasksUrl={buildTasksUrl}
                                onOpenReviewModal={() => setIsReviewModalOpen(true)}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-stretch">
                            <div className="lg:col-span-3">
                                <ReworkZone tasks={filteredReworkTasks} navigate={navigate} buildTasksUrl={buildTasksUrl} />
                            </div>

                            <div className="lg:col-span-5">
                                <TimelineList tasks={timelineTasks} navigate={navigate} buildTasksUrl={buildTasksUrl} />
                            </div>

                            <div className="lg:col-span-4">
                                <HotProjectList projects={member?.participatingProjects} navigate={navigate} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {!hideLowerSection && (
                <TeamLeadReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    tasks={teamLeadReviewTasks}
                    navigate={navigate}
                />
            )}
        </>
    );
};
