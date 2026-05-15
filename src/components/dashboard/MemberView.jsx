import React, { useMemo } from 'react';
import { useGetMyNotificationsQuery } from '../../api/notifications';
import { TASK_STATUS } from '../../utils/enums';

// New Modular Components
import { TodayFocusCard } from './member/TodayFocusCard';
import { MetricCardsGrid } from './member/MetricCardsGrid';
import { ReworkZone } from './member/ReworkZone';
import { TimelineList } from './member/TimelineList';
import { HotProjectList } from './member/HotProjectList';
import { TaskCalendar } from './TaskCalendar';

export const MemberView = ({
    dashboard,
    navigate,
}) => {
    const member = dashboard?.member;
    const { data: notifications = [] } = useGetMyNotificationsQuery();

    // Data Calculations
    const stats = useMemo(() => {
        if (!member) return { overdue: 0, today: 0, pending: 0, progress: 0 };

        const violationStats = member?.violationStats || {};
        const lateCount = Number(violationStats['LATE_UNFINISHED'] || 0) + Number(violationStats['LATE_SUBMISSION'] || 0);

        const today = new Date().toISOString().split('T')[0];
        const todayCount = member?.upcomingDeadlines?.filter(task =>
            task.deadline && task.deadline.startsWith(today)
        ).length || 0;

        const statusCounts = member?.statusCounts || {};
        const completedCount = Number(statusCounts[TASK_STATUS.COMPLETED] || 0) +
            Number(statusCounts[TASK_STATUS.ACCEPTED] || 0) +
            Number(statusCounts[TASK_STATUS.DONE] || 0);
        const doingCount = member?.doingCount || 0;
        const total = completedCount + doingCount;
        const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        return {
            overdue: lateCount,
            today: todayCount,
            pending: statusCounts[TASK_STATUS.AWAITING_REVIEW] || statusCounts['WAITING_APPROVAL'] || 0,
            progress: progress
        };
    }, [member]);

    if (!member) return null;

    // Timeline: 10 tasks closest to deadline
    const timelineTasks = (member?.upcomingDeadlines || []).slice(0, 10);

    return (
        <div className="space-y-8 pb-20">
            {/* Top Section: Focus & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                    <TaskCalendar tasks={member?.calendarTasks} />
                </div>
            </div>

            {/* Middle Section: Metrics */}
            <MetricCardsGrid member={member} />

            {/* Bottom Section: Main Work Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Rework Zone (3/12) */}
                <div className="lg:col-span-3">
                    <ReworkZone tasks={member?.reworkTasks} navigate={navigate} />
                </div>

                {/* Timeline (5/12) */}
                <div className="lg:col-span-5">
                    <TimelineList tasks={timelineTasks} navigate={navigate} />
                </div>

                {/* Hot Projects (4/12) */}
                <div className="lg:col-span-4">
                    <HotProjectList projects={member?.participatingProjects} navigate={navigate} />
                </div>
            </div>
        </div>
    );
};
