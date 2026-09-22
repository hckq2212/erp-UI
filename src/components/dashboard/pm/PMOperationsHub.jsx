import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    AlertCircle,
    Clock,
    Flame,
    ArrowUpRight,
    Users,
    ChevronRight,
    AlertTriangle,
    ShieldAlert,
    Sparkles
} from 'lucide-react';
import { getTaskDisplayName } from '../../../utils/taskName';
import { formatDateToDDMMYYYY } from '../../../utils/format';
import { getWorkloadColor, getWorkloadDisplayPercent, formatWorkloadLabel } from '../../../utils/workload';

export const PMOperationsHub = ({
    reviewTasks = [],
    overdueTasks = [],
    reworkTasks = [],
    workloads = [],
    teamMembers = [],
    navigate,
    onSelectMember
}) => {
    // 3 tabs answering the 3 core PM questions:
    // 'review' -> "Cái gì cần tôi duyệt ngay?"
    // 'overdue' -> "Đang trễ ở đâu?"
    // 'bottleneck' -> "Ai đang nghẽn?"
    const [activeTab, setActiveTab] = useState('review');

    // Filter staff with high workload (>= 100%) or high task concentration
    const overloadedStaff = useMemo(() => {
        if (!workloads || workloads.length === 0) return [];
        return workloads
            .filter(w => {
                const percent = Number(w.percent || w.displayPercent || 0);
                return percent >= 100 || (w.taskCount && w.taskCount >= 8);
            })
            .sort((a, b) => Number(b.percent || 0) - Number(a.percent || 0));
    }, [workloads]);

    const reviewCount = reviewTasks.length;
    const overdueCount = overdueTasks.length;
    const bottleneckCount = overloadedStaff.length + reworkTasks.length;

    // Helper to calculate days overdue
    const getDaysOverdue = (deadlineStr) => {
        if (!deadlineStr) return null;
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diffMs = now.getTime() - deadline.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 rounded-[1.25rem] p-5 shadow-xl shadow-orange-100/30 border border-orange-100 flex flex-col justify-between h-full min-h-[380px]">
            {/* Header / Tabs */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-orange-100/80">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F38820]">
                                <Sparkles size={11} className="text-[#F38820]" />
                                PM Operations Hub
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                            Tiêu điểm điều phối dự án
                        </h3>
                    </div>

                    {/* Navigation Pills */}
                    <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1">
                        {/* Tab 1: Cần duyệt ngay */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('review')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'review'
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <CheckCircle2 size={14} className={activeTab === 'review' ? 'text-orange-500' : 'text-slate-400'} />
                            <span>Cần duyệt</span>
                            {reviewCount > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    activeTab === 'review' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {reviewCount}
                                </span>
                            )}
                        </button>

                        {/* Tab 2: Đang trễ ở đâu */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('overdue')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'overdue'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <AlertCircle size={14} className={activeTab === 'overdue' ? 'text-red-500' : 'text-slate-400'} />
                            <span>Đang trễ</span>
                            {overdueCount > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    activeTab === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {overdueCount}
                                </span>
                            )}
                        </button>

                        {/* Tab 3: Ai đang nghẽn */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('bottleneck')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'bottleneck'
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Flame size={14} className={activeTab === 'bottleneck' ? 'text-purple-500' : 'text-slate-400'} />
                            <span>Ai nghẽn?</span>
                            {bottleneckCount > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    activeTab === 'bottleneck' ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {bottleneckCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Content Panels */}
                <div className="min-h-[240px]">
                    <AnimatePresence mode="wait">
                        {/* 1. CẦN DUYỆT NGAY */}
                        {activeTab === 'review' && (
                            <motion.div
                                key="tab-review"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2.5"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-xs font-bold text-slate-500">
                                        Có <span className="text-orange-600 font-black">{reviewCount}</span> việc chờ bạn đánh giá và duyệt kết quả
                                    </p>
                                    {reviewCount > 0 && (
                                        <span className="text-[11px] font-bold text-slate-400">Click để review</span>
                                    )}
                                </div>

                                <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {reviewCount > 0 ? (
                                        reviewTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => navigate(`/tasks/${task.id}/review`)}
                                                className="group relative cursor-pointer overflow-hidden rounded-xl border border-amber-100/80 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/5 flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 border border-amber-200/60">
                                                            {task.code || 'TASK'}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-400 truncate max-w-[220px]">
                                                            {task.project?.name || 'Dự án'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors truncate">
                                                        {getTaskDisplayName(task)}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                                        <span>Người gửi: <strong className="text-slate-700">{task.assignee?.fullName || 'N/A'}</strong></span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md shadow-orange-200 group-hover:scale-105 transition-transform shrink-0 flex items-center gap-1"
                                                >
                                                    <span>Duyệt ngay</span>
                                                    <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center rounded-xl bg-white/60 border border-dashed border-slate-200">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
                                                Không có việc nào cần duyệt
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Mọi kết quả công việc đã được nghiệm thu kịp thời!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* 2. ĐANG TRỄ Ở ĐÂU */}
                        {activeTab === 'overdue' && (
                            <motion.div
                                key="tab-overdue"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2.5"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-xs font-bold text-slate-500">
                                        Phát hiện <span className="text-red-600 font-black">{overdueCount}</span> task trễ hạn cần can thiệp điều phối
                                    </p>
                                </div>

                                <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {overdueCount > 0 ? (
                                        overdueTasks.map((task) => {
                                            const daysOverdue = getDaysOverdue(task.deadline);
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-red-100 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md hover:shadow-red-500/5 flex items-center justify-between gap-3"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase text-red-600 border border-red-200">
                                                                {task.code || 'TASK'}
                                                            </span>
                                                            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[200px]">
                                                                {task.projectName || 'Dự án'}
                                                            </span>
                                                            {daysOverdue !== null && daysOverdue > 0 && (
                                                                <span className="text-[10px] font-black uppercase text-red-500 bg-red-50/80 px-2 py-0.5 rounded-full ml-auto">
                                                                    Trễ {daysOverdue} ngày
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-sm font-black text-slate-800 group-hover:text-red-600 transition-colors truncate">
                                                            {getTaskDisplayName(task)}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                                            <span>Chịu trách nhiệm: <strong className="text-slate-800">{task.assignee?.fullName || 'Chưa phân công'}</strong></span>
                                                            <span>Hạn: <strong className="text-red-600">{task.deadline ? formatDateToDDMMYYYY(task.deadline) : 'N/A'}</strong></span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 flex items-center justify-center transition-colors shrink-0"
                                                    >
                                                        <ArrowUpRight size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-10 text-center rounded-xl bg-white/60 border border-dashed border-slate-200">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
                                                Không có task nào bị trễ hạn
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Mọi dự án đang bám sát tiến độ hoàn thành! 🚀
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* 3. AI ĐANG NGHẼN */}
                        {activeTab === 'bottleneck' && (
                            <motion.div
                                key="tab-bottleneck"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2.5"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-xs font-bold text-slate-500">
                                        Nhân sự có khối lượng tải cao (&gt;100%) hoặc task đang bị yêu cầu làm lại
                                    </p>
                                </div>

                                <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {bottleneckCount > 0 ? (
                                        <>
                                            {/* Danh sách nhân sự quá tải */}
                                            {overloadedStaff.map((staff) => {
                                                const displayPercent = getWorkloadDisplayPercent(staff);
                                                const color = getWorkloadColor(displayPercent);
                                                return (
                                                    <div
                                                        key={staff.userId}
                                                        onClick={() => onSelectMember && onSelectMember(staff.userId)}
                                                        className="group cursor-pointer overflow-hidden rounded-xl border border-purple-100 bg-white p-3 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between gap-3"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-100 to-purple-50 text-purple-700 flex items-center justify-center font-black text-xs shrink-0 uppercase">
                                                                {staff.fullName?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-black text-slate-900 truncate">
                                                                        {staff.fullName}
                                                                    </p>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                                        {staff.role}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all"
                                                                        style={{
                                                                            width: `${Math.min(displayPercent, 200) / 2}%`,
                                                                            backgroundColor: color
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0">
                                                            <span
                                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                                                                style={{ backgroundColor: color }}
                                                            >
                                                                {formatWorkloadLabel(staff)} Tải
                                                            </span>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                                {staff.taskCount || 0} task gánh
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Danh sách task bị Rework */}
                                            {reworkTasks.slice(0, 5).map((task) => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                                    className="group cursor-pointer overflow-hidden rounded-xl border border-amber-100 bg-white p-2.5 shadow-sm hover:border-amber-300 transition-all flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                                Làm lại
                                                            </span>
                                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                                {getTaskDisplayName(task)}
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                            {task.assignee?.fullName ? `Giao cho: ${task.assignee.fullName}` : task.projectName}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="py-10 text-center rounded-xl bg-white/60 border border-dashed border-slate-200">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
                                                Không có điểm nghẽn nhân sự
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Đội ngũ đang được phân bổ khối lượng cân bằng và hiệu quả! 💪
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
