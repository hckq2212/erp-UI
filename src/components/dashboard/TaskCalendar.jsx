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
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-fit">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">Lịch công việc</h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{format(currentMonth, 'MMMM yyyy', { locale: vi })}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasksByDay[dayKey] || [];
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            className={`aspect-square relative flex items-center justify-center rounded-2xl transition-all text-sm font-bold
                                ${!isSameMonth(day, currentMonth) ? 'text-gray-200' : 'text-gray-600'}
                                ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 z-10' : 'hover:bg-gray-50 text-gray-700'}
                                ${isToday(day) && !isSelected ? 'text-blue-600 ring-2 ring-blue-100' : ''}
                            `}
                        >
                            {format(day, 'd')}
                            {dayTasks.length > 0 && !isSelected && (
                                <div className="absolute bottom-1.5 flex gap-0.5">
                                    {dayTasks.slice(0, 3).map((t, i) => (
                                        <span key={i} className={`w-1 h-1 rounded-full ${['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED'].includes(t.status) ? 'bg-emerald-500' :
                                            ['OVERDUE', 'REJECTED'].includes(t.status) ? 'bg-rose-500' : 'bg-blue-500'
                                            }`} />
                                    ))}
                                    {dayTasks.length > 3 && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 flex-1">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                    Công việc ngày {format(selectedDate, 'dd/MM')}
                </h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {selectedTasks.length > 0 ? selectedTasks.map(task => (
                            <motion.button
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={task.id}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className={`w-full text-left p-3 rounded-xl border shadow-sm transition-all flex items-center gap-3 group ${TASK_STATUS_COLORS[task.status] || 'bg-gray-50 border-gray-100 text-gray-700'}`}
                            >
                                <div className="w-1.5 h-8 rounded-full bg-current opacity-20 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{task.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase">{TASK_STATUS_LABELS[task.status]}</p>
                                </div>
                            </motion.button>
                        )) : (
                            <div className="text-center py-6 text-gray-400 italic text-xs">Không có công việc nào</div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
