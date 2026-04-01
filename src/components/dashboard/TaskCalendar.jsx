import React, { useState, useMemo } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
    isSameDay, isToday, addDays
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/enums';

export const TaskCalendar = ({ tasks = [] }) => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const tasksByDay = useMemo(() => {
        const map = {};
        tasks.forEach(task => {
            const date = task.end;
            if (date) {
                const dayKey = format(new Date(date), 'yyyy-MM-dd');
                if (!map[dayKey]) map[dayKey] = [];
                map[dayKey].push(task);
            }
        });
        return map;
    }, [tasks]);

    const selectedTasks = tasksByDay[format(selectedDate, 'yyyy-MM-dd')] || [];

    return (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-6 h-full min-h-[320px]">
            {/* Left: Calendar Section */}
            <div className="flex-1 flex flex-col min-w-[220px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center ml-1 gap-2">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 leading-tight tracking-tight">Lịch công việc</h3>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: vi })}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-1.5 hover:bg-gray-50 rounded-lg transition-all text-gray-300"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-1.5 hover:bg-gray-50 rounded-lg transition-all text-gray-300"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-[2px] mb-2 px-1">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                        <div key={day} className="text-center text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none py-1">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-[2px] px-1">
                    {days.map((day, idx) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayTasks = tasksByDay[dayKey] || [];
                        const isSelected = isSameDay(day, selectedDate);

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedDate(day);
                                    if (!isSameMonth(day, currentMonth)) {
                                        setCurrentMonth(startOfMonth(day));
                                    }
                                }}
                                className={`w-7 h-7 mx-auto relative flex items-center justify-center rounded-lg transition-all text-[10px] font-bold
                                    ${!isSameMonth(day, currentMonth) ? 'text-slate-300' : 'text-slate-900'}
                                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 z-10' : 'hover:bg-slate-50'}
                                    ${isToday(day) && !isSelected ? 'text-indigo-600 ring-1 ring-indigo-100/50' : ''}
                                `}
                            >
                                {format(day, 'd')}
                                {dayTasks.length > 0 && !isSelected && (
                                    <div className="absolute bottom-0.5 flex gap-px">
                                        {dayTasks.slice(0, 3).map((t, i) => (
                                            <span key={i} className={`w-0.5 h-0.5 rounded-full ${['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED'].includes(t.status) ? 'bg-emerald-500' :
                                                ['OVERDUE', 'REJECTED'].includes(t.status) ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Selected Day Tasks (Move to same row) */}
            <div className="lg:w-48 xl:w-56 overflow-hidden flex flex-col pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-50 lg:pl-5">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Ngày {format(selectedDate, 'dd/MM')}
                </h4>
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[160px]">
                    <div className="space-y-1.5">
                        <AnimatePresence mode="popLayout">
                            {selectedTasks.length > 0 ? selectedTasks.map(task => (
                                <motion.button
                                    whileHover={{ x: 3 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={task.id}
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    className={`w-full text-left p-2.5 rounded-xl border shadow-sm transition-all flex items-center gap-2 group ${TASK_STATUS_COLORS[task.status] || 'bg-gray-50 border-gray-100 text-gray-700'}`}
                                >
                                    <div className="w-1 h-6 rounded-full bg-current opacity-20 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-gray-900 group-hover:text-blue-600 truncate transition-colors leading-tight">{task.name}</p>
                                        {/* <div className="flex gap-2 items-center mt-0.5"> */}
                                        <p className="text-[8px] text-gray-400 font-bold uppercase truncate max-w-[80px]">{task?.project?.name || 'Ngoài dự án'}</p>
                                        <p className="text-[8px] font-black text-blue-600/60 uppercase">{TASK_STATUS_LABELS[task.status]}</p>
                                        {/* </div> */}
                                    </div>
                                </motion.button>
                            )) : (
                                <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
                                    <div className="p-2.5 rounded-full bg-slate-50">
                                        <AlertCircle className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <p className="text-gray-300 italic text-[10px] font-bold uppercase tracking-widest">Không có Task</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
