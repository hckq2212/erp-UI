import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../../utils/enums';

export const TimelineList = ({ tasks = [], navigate }) => {
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    return (
        <div className="bg-white p-4 rounded-[1rem] border border-slate-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Deadline sắp tới</h3>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/tasks')}
                    className="text-[9px] font-black text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                    Xem lịch đầy đủ <ChevronRight size={10} />
                </button>
            </div>

            <div className="relative space-y-6 before:absolute before:left-[35px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                {sortedTasks.length > 0 ? (
                    sortedTasks.slice(0, 10).map((task, index) => {
                        const dateObj = new Date(task.deadline);
                        const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const date = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={task.id}
                                className="flex items-start gap-4 group cursor-pointer"
                                onClick={() => navigate(`/tasks/${task.id}`)}
                            >
                                <div className="flex flex-col min-w-[50px] pt-1">
                                    <span className="text-[10px] font-black text-slate-900">
                                        {time === "Invalid Date" ? "09:00" : time}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-400">
                                        {date === "Invalid Date" ? "01/01" : date}
                                    </span>
                                </div>

                                <div className="relative pt-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-50 group-hover:scale-125 transition-transform" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                                                {task.name}
                                            </h4>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">
                                                {task.projectName || 'Dự án nội bộ'}
                                            </p>
                                        </div>
                                        <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase whitespace-nowrap ${TASK_STATUS_COLORS[task.status] || 'bg-slate-50 text-slate-500'}`}>
                                            {TASK_STATUS_LABELS[task.status] || task.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-10">
                        <p className="text-slate-400 text-xs italic">Không có deadline sắp tới</p>
                    </div>
                )}
            </div>
        </div>
    );
};
