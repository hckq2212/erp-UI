import React, { useState, useMemo } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
    isSameDay, isToday
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_STATUS } from '../../utils/enums';

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
            const date = task.deadline || task.end;
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
        <div className="bg-white p-4 rounded-[0.75rem] shadow-sm flex flex-col lg:flex-row gap-4 h-full h-fit">
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
                                className={`w-8 h-8 mx-auto relative flex items-center justify-center rounded-md transition-all text-[11px] font-black
                                    ${!isSameMonth(day, currentMonth) ? 'text-slate-200' : 'text-slate-900'}
                                    ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-100/50 z-10' : 'hover:bg-slate-50'}
                                    ${isToday(day) && !isSelected ? 'text-blue-600 ring-2 ring-blue-50' : ''}
                                `}
                            >
                                {format(day, 'd')}
                                {dayTasks.length > 0 && !isSelected && (
                                    <div className="absolute bottom-0.5 flex gap-px">
                                        {dayTasks.slice(0, 3).map((t, i) => (
                                            <span key={i} className={`w-0.5 h-0.5 rounded-full ${[TASK_STATUS.COMPLETED, TASK_STATUS.ACCEPTED, TASK_STATUS.DONE, TASK_STATUS.INTERNAL_COMPLETED].includes(t.status) ? 'bg-emerald-500' :
                                                [TASK_STATUS.OVERDUE, TASK_STATUS.REJECTED].includes(t.status) ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Selected Day Tasks */}
            <div className="lg:w-56 xl:w-64 overflow-hidden flex flex-col pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-50 lg:pl-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                    Ngày {format(selectedDate, 'dd/MM')}
                </h4>
                
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[200px]">
                    <div className="relative space-y-6 before:absolute before:left-[47px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                        <AnimatePresence mode="popLayout">
                            {selectedTasks.length > 0 ? selectedTasks.map((task, index) => {
                                const dateObj = new Date(task.deadline || task.end);
                                const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                
                                // Map status to dot colors
                                const getDotColor = (status) => {
                                    if ([TASK_STATUS.COMPLETED, TASK_STATUS.ACCEPTED, TASK_STATUS.DONE, TASK_STATUS.INTERNAL_COMPLETED].includes(status)) return 'bg-emerald-500';
                                    if ([TASK_STATUS.OVERDUE, TASK_STATUS.REJECTED].includes(status)) return 'bg-rose-500';
                                    if ([TASK_STATUS.DOING, TASK_STATUS.REWORKING].includes(status)) return 'bg-blue-500';
                                    return 'bg-amber-500';
                                };

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={task.id}
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        className="flex items-start gap-4 group cursor-pointer relative"
                                    >
                                        <span className="text-[10px] font-black text-slate-400 min-w-[35px] pt-1">
                                            {time === "Invalid Date" ? "09:00" : time}
                                        </span>
                                        
                                        <div className="relative pt-1.5 z-10">
                                            <div className={`w-2 h-2 rounded-full ${getDotColor(task.status)} ring-4 ring-white group-hover:scale-125 transition-transform`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h5 className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                                                        {task.name}
                                                    </h5>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase truncate">
                                                        {task?.project?.name || task?.projectName || 'Nhiệm vụ'}
                                                    </p>
                                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${TASK_STATUS_COLORS[task.status] || 'bg-slate-50 text-slate-500'}`}>
                                                        {TASK_STATUS_LABELS[task.status] || task.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
                                    <div className="p-2.5 rounded-full bg-slate-50">
                                        <AlertCircle className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <p className="text-gray-300 italic text-[10px] font-bold uppercase tracking-widest">Không có công việc</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
