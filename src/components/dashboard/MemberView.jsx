import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCalendar } from './TaskCalendar';
import { MemberProjectList } from './MemberProjectList';
import { WorkloadChart } from './WorkloadChart';
import { getRemainingTime } from '../../utils/format';
import { URGENCY_THEMES } from '../../utils/enums';
import {
    Clock,
    CheckCircle2,
    Layers,
    Coins,
    AlertTriangle,
    History,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

const COMPLETED_STATUSES = new Set([
    'COMPLETED',
    'ACCEPTED',
    'DONE',
    'INTERNAL_COMPLETED'
]);

const getUrgencyLevel = (deadline, status) => {
    if (!deadline) return 'safe';
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status;
    if (COMPLETED_STATUSES.has(normalizedStatus)) return 'completed';
    if (normalizedStatus === 'CANCELLED') return 'cancelled';

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) return 'safe';

    const diff = deadlineDate.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);

    if (diff < 0) return 'overdue';
    if (days <= 1) return 'today';
    if (days <= 3) return 'soon';
    return 'safe';
};

const MetricCard = ({ title, value, icon: Icon, color, onClick, isExpanded, subValue, trend }) => {
    const colorVariants = {
        blue: {
            gradient: 'from-blue-500/10 to-transparent',
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            fill: '#2563eb'
        },
        emerald: {
            gradient: 'from-emerald-500/10 to-transparent',
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            fill: '#10b981'
        },
        purple: {
            gradient: 'from-purple-500/10 to-transparent',
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            fill: '#9333ea'
        },
        amber: {
            gradient: 'from-amber-500/10 to-transparent',
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            fill: '#f59e0b'
        },
    };

    const variant = colorVariants[color] || colorVariants.blue;

    return (
        <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all ${onClick ? 'cursor-pointer hover:shadow-[0_12px_35px_rgb(0,0,0,0.05)]' : ''}`}
            onClick={onClick}
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${variant.gradient} opacity-40 blur-xl rounded-full`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-2xl ${variant.bg} ${variant.text}`}>
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                    {/* {trend && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">
                            <TrendingUp size={12} />
                            <span>{trend}%</span>
                        </div>
                    )} */}
                </div>

                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{title}</p>
                    <div className="flex items-baseline gap-1.5">
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h4>
                        {subValue && <span className="text-xl font-bold text-slate-400">{subValue}</span>}
                    </div>
                </div>

                {onClick && (
                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest group">
                        <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                        <ChevronRight size={10} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const MemberView = ({
    dashboard,
    navigate,
}) => {
    const [showProjects, setShowProjects] = React.useState(false);
    const [showWorkload, setShowWorkload] = React.useState(false);
    const [showRework, setShowRework] = React.useState(false);

    const projectsPanelId = React.useId();
    const workloadPanelId = React.useId();

    const member = dashboard?.member;
    const statusCounts = member?.statusCounts || {};
    const violationStats = member?.violationStats || {};
    const lateCount = Number(violationStats['LATE_UNFINISHED'] || 0) + Number(violationStats['LATE_SUBMISSION'] || 0);
    const reworkCountValue = Number(violationStats['EXCESSIVE_REWORK'] || 0);
    const totalViniCoin = member?.vinicoinTotal?.toLocaleString() || 0;
    const withdrawnViniCoin = member?.vinicoinWithdrawn?.toLocaleString() || 0;

    const completedCount =
        Number(statusCounts.COMPLETED || 0) + Number(statusCounts.ACCEPTED || 0) + Number(statusCounts.DONE || 0);

    return (
        <div className="space-y-6 pb-20">
            {/* Tầng 1: Hàng chỉ số chính (4 cột) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Đang thực hiện"
                    value={member?.doingCount ?? 0}
                    icon={Clock}
                    color="blue"
                />

                <MetricCard
                    title="Đã nghiệm thu"
                    value={completedCount}
                    icon={CheckCircle2}
                    color="emerald"
                    onClick={() => {
                        setShowWorkload(!showWorkload);
                        setShowProjects(false);
                    }}
                    isExpanded={showWorkload}
                    trend={12}
                />

                <MetricCard
                    title="Dự án tham gia"
                    value={member?.participatingProjects?.length || 0}
                    icon={Layers}
                    color="purple"
                    onClick={() => {
                        setShowProjects(!showProjects);
                        setShowWorkload(false);
                    }}
                    isExpanded={showProjects}
                />

                <MetricCard
                    title="ViniCoin"
                    value={`Đã rút ${withdrawnViniCoin}`}
                    subValue={`/${totalViniCoin}`}
                    icon={Coins}
                    color="amber"
                />
            </div>

            {/* Expandable Sections */}
            <AnimatePresence mode="wait">
                {(showWorkload || showProjects) && (
                    <motion.div
                        key={showWorkload ? 'workload' : 'projects'}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[1.5rem] p-6 shadow-[0_15px_40px_rgb(0,0,0,0.03)]"
                    >
                        {showWorkload && (
                            <div id={workloadPanelId} className="h-[220px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Hiệu suất nghiệm thu</h3>
                                    <span className="text-[9px] font-bold text-slate-400">6 tháng gần nhất</span>
                                </div>
                                <WorkloadChart data={member?.completionStats || []} />
                            </div>
                        )}
                        {showProjects && (
                            <div id={projectsPanelId}>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 px-1">Danh sách dự án đang thực hiện</h3>
                                <MemberProjectList projects={member?.participatingProjects} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tầng 2: Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Column 1: Cần làm lại & Vi phạm (3/12) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <History size={80} className="text-rose-500" />
                        </div>

                        <div className="relative z-10">
                            <button
                                type="button"
                                className="w-full text-left focus:outline-none mb-6"
                                onClick={() => setShowRework((prev) => !prev)}
                            >
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                                    <AlertTriangle size={12} className="animate-pulse" />
                                    Cần làm lại
                                </p>
                                <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">
                                    {member?.reworkCount ?? member?.reworkTasks?.length ?? 0}
                                </h4>
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>{showRework ? 'Thu gọn' : 'Chi tiết'}</span>
                                    <ChevronRight size={10} className={`transition-transform duration-300 ${showRework ? 'rotate-90' : ''}`} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {showRework && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                            {member?.reworkTasks?.length > 0 ? (
                                                member.reworkTasks.map((task) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        key={task.id}
                                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                                        className="p-4 bg-rose-50/40 hover:bg-white rounded-2xl border border-rose-100/30 transition-all cursor-pointer group/item hover:shadow-md"
                                                    >
                                                        <h5 className="text-[11px] font-black text-slate-900 group-hover/item:text-rose-600 transition-colors truncate">{task.name}</h5>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 truncate">{task.projectName || 'Dự án'}</p>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-slate-300 italic py-4">Sạch bóng task làm lại!</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                                <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-0.5">Thống kê vi phạm</p>
                                <div className="flex justify-between items-center text-[9px] font-black">
                                    <span className="text-slate-400 uppercase tracking-tighter">Trễ hạn</span>
                                    <span className={`px-2 py-0.5 rounded-full ${lateCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-300'}`}>{lateCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black">
                                    <span className="text-slate-400 uppercase tracking-tighter">Làm lại quá mức</span>
                                    <span className={`px-2 py-0.5 rounded-full ${reworkCountValue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-300'}`}>{reworkCountValue}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Deadlines (4/12) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm h-fit flex flex-col">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h3 className="text-[10px] font-black text-slate-900 tracking-[0.1em] uppercase flex items-center gap-2">
                            <Clock size={12} className="text-amber-500" />
                            Tiến độ & Deadline
                        </h3>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {member?.upcomingDeadlines?.length > 0 ? (
                            member.upcomingDeadlines.slice(0, 10).map((task) => {
                                const urgency = getUrgencyLevel(task.deadline, task.status);
                                const theme = URGENCY_THEMES[urgency] || URGENCY_THEMES.safe;
                                const remaining = getRemainingTime(task.deadline, task.status);
                                return (
                                    <motion.div
                                        key={task.id}
                                        whileHover={{ x: 5 }}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-blue-100 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="min-w-0">
                                                <h4 className="font-black text-[11px] text-slate-900 uppercase truncate transition-colors group-hover:text-blue-600">{task.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 truncate">{task.projectName || 'Công việc nội bộ'}</p>
                                            </div>
                                            <div className={`px-2 py-1.5 rounded-xl text-[9px] font-black whitespace-nowrap shadow-sm border border-black/5 ${theme.bg} ${theme.text}`}>
                                                {remaining?.text}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center italic text-xs text-slate-300 gap-2">
                                <CheckCircle2 size={32} strokeWidth={1} className="text-slate-100" />
                                <span>Chưa có deadline mới</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: Calendar (5/12) */}
                <div className="lg:col-span-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
                    <TaskCalendar tasks={member?.calendarTasks} />
                </div>
            </div>
        </div>
    );
};
