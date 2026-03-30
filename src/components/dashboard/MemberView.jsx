import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Briefcase, Hash, ChevronRight, CheckCircle2, TrendingUp, FileCheck } from 'lucide-react';
import { TaskCalendar } from './TaskCalendar';
import { MemberProjectList } from './MemberProjectList';
import { WorkloadChart } from './WorkloadChart';
import { StatusSummaryCard } from './StatusSummaryCard';
import { getRemainingTime } from '../../utils/format';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, URGENCY_THEMES } from '../../utils/enums';

export const MemberView = ({ dashboard, navigate, isViewingMember, selectedMemberId, teamMembers }) => {
    // Helper to get urgency level for color coding
    const getUrgencyLevel = (deadline, status) => {
        if (!deadline) return 'safe';
        if (['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED'].includes(status)) return 'completed';

        const diff = new Date(deadline) - new Date();
        const days = diff / (1000 * 60 * 60 * 24);

        if (diff < 0) return 'overdue';
        if (days < 1) return 'today';
        if (days < 3) return 'soon';
        return 'safe';
    };

    // const urgencyThemes = {
    //     overdue: { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-600', text: 'text-rose-700', icon: 'text-rose-500' },
    //     today: { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-orange-600', text: 'text-orange-700', icon: 'text-orange-500' },
    //     soon: { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-600', text: 'text-amber-700', icon: 'text-amber-500' },
    //     safe: { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-400', text: 'text-emerald-700', icon: 'text-emerald-400' },
    //     completed: { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-600', text: 'text-emerald-700', icon: 'text-emerald-500' }
    // };

    const statusCounts = dashboard.member?.statusCounts || {};
    const violationStats = dashboard.member?.violationStats || {};
    const lateCount = (violationStats['LATE_UNFINISHED'] || 0) + (violationStats['LATE_SUBMISSION'] || 0);
    const reworkCount = violationStats['EXCESSIVE_REWORK'] || 0;

    const statusGroups = [
        {
            label: 'Đang thực hiện',
            count: (statusCounts.DOING || 0) + (statusCounts.REWORKING || 0),
            color: 'blue',
            icon: TrendingUp
        },
        {
            label: 'Đợi phê duyệt',
            count: (statusCounts.AWAITING_ACCEPTANCE || 0) + (statusCounts.INTERNAL_COMPLETED || 0) + (statusCounts.AWAITING_REVIEW || 0),
            color: 'purple',
            icon: FileCheck
        },
        {
            label: 'Đã hoàn thành',
            count: (statusCounts.COMPLETED || 0) + (statusCounts.ACCEPTED || 0) + (statusCounts.DONE || 0),
            color: 'green',
            icon: CheckCircle2
        },
        {
            label: 'Vấn đề',
            count: (statusCounts.REJECTED || 0) + (statusCounts.OVERDUE || 0),
            color: 'rose',
            icon: AlertCircle
        }
    ];

    return (
        <div className="space-y-10 pb-12">
            {/* Task Status Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
            >
                {statusGroups.map((group, idx) => (
                    <StatusSummaryCard
                        key={idx}
                        label={group.label}
                        count={group.count}
                        color={group.color}
                        icon={group.icon}
                    />
                ))}
                <motion.div
                    whileHover={{ y: -5, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                    className="p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between transition-all bg-rose-50 border-rose-200 relative overflow-hidden h-full"
                >
                    {/* Decorative background element */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-100/50 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-200/50">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-950 mt-0.5">
                                Sai phạm
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-rose-950 leading-none">
                                    {lateCount}
                                </span>
                                <Clock className="w-3 h-3 text-rose-400" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-600/60 mt-2">
                                Trễ hạn
                            </span>
                        </div>
                        <div className="flex flex-col border-l border-rose-200/80 pl-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-rose-950 leading-none">
                                    {reworkCount}
                                </span>
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-600/60 mt-2">
                                Làm lại
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            {/* Middle Row: Calendar & Deadlines */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                <div className="lg:col-span-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -mr-16 -mt-16 pointer-events-none opacity-50" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Deadline sắp tới</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">10 task gần deadline nhất</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {dashboard.member?.upcomingDeadlines?.length > 0 ? (
                                <div className="grid gap-3">
                                    {dashboard.member.upcomingDeadlines.map((task, index) => {
                                        const urgency = getUrgencyLevel(task.deadline, task.status);
                                        const theme = URGENCY_THEMES[urgency];
                                        const remaining = getRemainingTime(task.deadline, task.status);

                                        return (
                                            <motion.button
                                                key={task.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 ${theme.border} ${theme.bg} hover:shadow-md hover:scale-[1.01] transition-all duration-300 w-full text-left`}
                                            >
                                                {/* Left Urgency Accent */}

                                                <div className="flex-1 min-w-0 ml-1">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-sm ${TASK_STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                            {TASK_STATUS_LABELS[task.status]}
                                                        </span>
                                                    </div>

                                                    <h4 className=" font-bold text-sm truncate text-blue-600 transition-colors uppercase tracking-tight">
                                                        {task.name}
                                                    </h4>

                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">
                                                                {task.projectName || 'Công việc nội bộ'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 shrink-0 pr-2">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border ${theme.border} shadow-sm`}>
                                                        <Clock className={`w-3.5 h-3.5 ${theme.icon}`} />
                                                        <span className={`text-[11px] font-black uppercase tracking-tight ${theme.text}`}>
                                                            {remaining.text}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-100">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                        <AlertCircle className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Chưa có deadline nào sắp tới</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <TaskCalendar tasks={dashboard.member?.calendarTasks} />
                </div>
            </motion.div>

            {/* Bottom Row: Projects & Productivity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                <div className="lg:col-span-4">
                    <MemberProjectList projects={dashboard.member?.participatingProjects} />
                </div>
                <div className="lg:col-span-8">
                    <WorkloadChart data={dashboard.member?.completionStats} />
                </div>
            </motion.div>
        </div>
    );
};
