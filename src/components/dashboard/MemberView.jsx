import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCalendar } from './TaskCalendar';
import { MemberProjectList } from './MemberProjectList';
import { WorkloadChart } from './WorkloadChart';
import { getRemainingTime } from '../../utils/format';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, URGENCY_THEMES } from '../../utils/enums';

export const MemberView = ({
    dashboard,
    navigate,
    isViewingMember,
    selectedMemberId,
    teamMembers
}) => {
    const [showProjects, setShowProjects] = React.useState(false);
    const [showWorkload, setShowWorkload] = React.useState(false);
    const [showRework, setShowRework] = React.useState(false);

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

    const statusCounts = dashboard.member?.statusCounts || {};
    const violationStats = dashboard.member?.violationStats || {};
    const lateCount = (violationStats['LATE_UNFINISHED'] || 0) + (violationStats['LATE_SUBMISSION'] || 0);
    const reworkCount = violationStats['EXCESSIVE_REWORK'] || 0;

    return (
        <div className="space-y-6 pb-12">
            {/* Tầng 1: Hàng chỉ số chính (4 cột) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {/* 1. Đang thực hiện */}
                <div className="p-5 rounded-3xl border border-slate-100 bg-blue-50/50 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-2">Đang thực hiện</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{dashboard.member?.doingCount}</h4>
                </div>
                {/* 2. Đã nghiệm thu */}
                <div
                    className={`p-5 rounded-3xl border transition-all duration-500 cursor-pointer group ${showWorkload ? 'bg-white border-emerald-200 shadow-xl shadow-emerald-100' : 'bg-emerald-50/50 border-slate-100 shadow-sm hover:bg-emerald-100/50'
                        }`}
                    onClick={() => setShowWorkload(!showWorkload)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${showWorkload ? 'text-emerald-600' : 'text-emerald-600/60'}`}>Đã nghiệm thu</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${showWorkload ? 'text-emerald-400' : 'text-emerald-400 group-hover:text-emerald-600'}`}>
                            {showWorkload ? 'Thu gọn' : 'Chi tiết'}
                        </span>
                    </div>
                    <h4 className={`text-2xl font-black tracking-tighter transition-colors ${showWorkload ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {(statusCounts.COMPLETED || 0) + (statusCounts.ACCEPTED || 0) + (statusCounts.DONE || 0)}
                    </h4>

                    {showWorkload && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 200 }}
                            className="mt-4 pt-4 border-t border-emerald-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <WorkloadChart data={dashboard.member?.completionStats || []} />
                        </motion.div>
                    )}
                </div>
                {/* 3. Dự án đang tham gia */}
                <div
                    className={`p-5 rounded-3xl border transition-all duration-500 cursor-pointer group ${showProjects ? 'bg-white border-purple-200 shadow-xl shadow-purple-100' : 'bg-purple-50/50 border-slate-100 shadow-sm hover:bg-purple-100/50'
                        }`}
                    onClick={() => setShowProjects(!showProjects)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${showProjects ? 'text-purple-600' : 'text-purple-600/60'}`}>Dự án đang tham gia</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${showProjects ? 'text-purple-400' : 'text-purple-400 group-hover:text-purple-600'}`}>
                            {showProjects ? 'Thu gọn' : 'Chi tiết'}
                        </span>
                    </div>
                    <h4 className={`text-2xl font-black tracking-tighter transition-colors ${showProjects ? 'text-purple-600' : 'text-slate-900'}`}>
                        {dashboard.member?.participatingProjects?.length || 0}
                    </h4>

                    {showProjects && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-purple-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-3">Danh sách dự án</p>
                            <MemberProjectList projects={dashboard.member?.participatingProjects} />
                        </motion.div>
                    )}
                </div>

                {/* 4. ViniCoin */}
                <div
                    className="p-5 rounded-3xl border border-slate-100 bg-amber-50/50 shadow-sm cursor-pointer hover:bg-amber-100/50 transition-colors"
                >
                    <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em] mb-2">ViniCoin</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng cộng</span>
                            <span className="text-xl font-black text-slate-900 tracking-tighter">{dashboard.member?.vinicoinTotal?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex flex-col border-l border-amber-200/30 pl-3">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã rút</span>
                            <span className="text-xl font-black text-rose-500 tracking-tighter">{dashboard.member?.vinicoinWithdrawn?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tầng 2: Nội dung chi tiết (Cấu trúc 3 cột 12-grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Cột 1: Cần làm lại & Vi phạm (3/12) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        {/* Reworking */}
                        <div
                            className="cursor-pointer group"
                            onClick={() => setShowRework(!showRework)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[9px] font-black text-rose-600/60 uppercase tracking-widest">Cần làm lại</p>
                                <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${showRework ? 'text-rose-400' : 'text-slate-300 group-hover:text-rose-400'}`}>
                                    {showRework ? 'Thu gọn' : 'Chi tiết'}
                                </span>
                            </div>
                            <h4 className={`text-3xl font-black tracking-tighter transition-colors ${showRework ? 'text-rose-600' : 'text-rose-950'}`}>
                                {dashboard.member?.reworkCount}
                            </h4>

                            <AnimatePresence>
                                {showRework && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {dashboard.member?.reworkTasks?.length > 0 ? (
                                                dashboard.member.reworkTasks.map(task => (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                                        className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/50 hover:bg-white hover:shadow-md transition-all group/item cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h5 className="text-[11px] font-bold text-rose-900 group-hover/item:text-rose-600 truncate flex-1 mr-2">{task.name}</h5>
                                                            {/* <span className="text-[8px] font-bold text-rose-400 whitespace-nowrap">{(task.code)}</span> */}
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{task.projectName || 'Dự án không tên'}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-slate-400 italic py-2">Không có task cần làm lại</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Violations */}
                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-3">Lịch sử vi phạm</p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-slate-400 uppercase tracking-tighter">Trễ hạn</span>
                                    <span className="text-rose-600">{lateCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-slate-400 uppercase tracking-tighter">Làm lại nhiều lần</span>
                                    <span className="text-rose-600">{reworkCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột 2: Deadlines (5/12) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-fit">
                    <h3 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-6 px-1">Deadline sắp tới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar content-start">
                        {dashboard.member?.upcomingDeadlines?.length > 0 ? (
                            dashboard.member.upcomingDeadlines.slice(0, 10).map((task) => {
                                const urgency = getUrgencyLevel(task.deadline, task.status);
                                const theme = URGENCY_THEMES[urgency];
                                const remaining = getRemainingTime(task.deadline, task.status);
                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        className={`w-full group flex flex-col justify-center p-3 rounded-2xl border transition-all hover:shadow-md ${theme.border} ${theme.bg}`}
                                    >
                                        <div className="min-w-0 w-full text-left">
                                            <h4 className="font-bold text-[11px] text-slate-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">{task.name}</h4>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[60%]">{task.projectName || 'Công việc nội bộ'}</p>
                                                <span className={`text-[9px] font-black truncate shrink-0 ${theme.text}`}>
                                                    {remaining.text}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="col-span-full h-full flex items-center justify-center italic text-[9px] text-slate-300 uppercase tracking-widest">Không có dữ liệu</div>
                        )}
                    </div>
                </div>

                {/* Cột 3: Calendar (4/12) */}
                <div className="lg:col-span-4 bg-white  rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-fit">
                    <TaskCalendar tasks={dashboard.member?.calendarTasks} compact={true} />
                </div>
            </div>
        </div>
    );
};
