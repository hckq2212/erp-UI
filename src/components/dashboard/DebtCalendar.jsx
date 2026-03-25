import React, { useState, useMemo } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
    isSameDay, isToday
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, DollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/format';

export const DebtCalendar = ({ debts = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const debtsByDay = useMemo(() => {
        const map = {};
        debts.forEach(debt => {
            const date = debt.dueDate;
            if (date) {
                const dayKey = format(new Date(date), 'yyyy-MM-dd');
                if (!map[dayKey]) map[dayKey] = [];
                map[dayKey].push(debt);
            }
        });
        return map;
    }, [debts]);

    const selectedDebts = debtsByDay[format(selectedDate, 'yyyy-MM-dd')] || [];

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">Lịch công nợ</h3>
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
                    const dayDebts = debtsByDay[dayKey] || [];
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            className={`aspect-square relative flex items-center justify-center rounded-2xl transition-all text-sm font-bold
                                ${!isSameMonth(day, currentMonth) ? 'text-gray-200' : 'text-gray-600'}
                                ${isSelected ? 'bg-rose-600 text-white shadow-lg shadow-rose-100 z-10' : 'hover:bg-gray-50 text-gray-700'}
                                ${isToday(day) && !isSelected ? 'text-rose-600 ring-2 ring-rose-100' : ''}
                            `}
                        >
                            {format(day, 'd')}
                            {dayDebts.length > 0 && !isSelected && (
                                <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white shadow-sm`} />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 flex-1">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                    Hạn thanh toán: {format(selectedDate, 'dd/MM/yyyy')}
                </h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {selectedDebts.length > 0 ? selectedDebts.map(debt => (
                            <motion.div
                                whileHover={{ x: 5 }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={debt.id}
                                className="w-full text-left p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-white text-rose-400 shadow-sm flex items-center justify-center">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate">{debt.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase truncate">{debt.customerName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-rose-600">{formatCurrency(debt.remaining)}</p>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-6 text-gray-400 italic text-xs">Không có kế hoạch thanh toán nào cho ngày này</div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
