import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { getTaskDisplayName } from '../../../utils/taskName';

export const ReworkZone = ({ tasks = [], navigate }) => {
    return (
        <div className="bg-white p-4 rounded-[1rem] border border-slate-100 shadow-sm relative overflow-hidden h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg relative">
                        <AlertTriangle size={18} />
                        {tasks.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full animate-bounce">
                                {tasks.length}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Rework Zone</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Các task cần chỉnh sửa</p>
                    </div>
                </div>
                <button className="text-[9px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest flex items-center gap-1">
                    Xem tất cả <ChevronRight size={10} />
                </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.length > 0 ? (
                    tasks.map((task, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={task.id}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="p-4 bg-rose-50/30 hover:bg-white hover:shadow-md border border-rose-100/20 hover:border-rose-100 rounded-xl transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-[11px] font-black text-slate-900 group-hover:text-rose-600 transition-colors truncate w-2/3">
                                    {getTaskDisplayName(task)}
                                </h4>
                                <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg uppercase">
                                    Hôm nay
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Khách hàng</p>
                                    <p className="text-[9px] font-black text-slate-600">{task.clientName || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Deadline</p>
                                    <p className="text-[9px] font-black text-rose-600">
                                        {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 italic text-xs gap-3">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                            <ChevronRight size={24} className="rotate-[-90deg]" />
                        </div>
                        <span>Tuyệt vời! Không có task cần làm lại.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
