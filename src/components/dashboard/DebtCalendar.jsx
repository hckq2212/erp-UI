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

export const DebtCalendar = ({ debts = [], compact = false }) => {
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
        <div className={`bg-white border border-gray-100 shadow-sm flex flex-col h-full ${compact ? 'p-3 rounded-[0.75rem]' : 'p-8 rounded-[2.5rem]'}`}>
            <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-8'}`}>
                <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
                    <div className={`${compact ? 'w-8 h-8 rounded-md' : 'w-10 h-10 rounded-xl'} bg-rose-50 text-rose-600 flex items-center justify-center`}>
                        <AlertCircle className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                    </div>
                    <div>
                        <h3 className={`${compact ? 'text-xs' : 'text-xl'} font-black text-gray-900 leading-tight`}>Lịch công nợ</h3>
                        <p className={`${compact ? 'text-[8px]' : 'text-xs'} text-gray-400 font-medium uppercase tracking-wider`}>{format(currentMonth, 'MMMM yyyy', { locale: vi })}</p>
                    </div>
                </div>
                <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className={`${compact ? 'p-1 rounded-md' : 'p-2 rounded-xl'} hover:bg-gray-100 transition-all`}
                    >
                        <ChevronLeft className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className={`${compact ? 'p-1 rounded-md' : 'p-2 rounded-xl'} hover:bg-gray-100 transition-all`}
                    >
                        <ChevronRight className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-7 gap-1 ${compact ? 'mb-2' : 'mb-4'}`}>
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                    <div key={day} className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-center font-black text-gray-400 uppercase tracking-widest`}>{day}</div>
                ))}
            </div>

            <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-2'}`}>
                {days.map((day, idx) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayDebts = debtsByDay[dayKey] || [];
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            className={`aspect-square relative flex items-center justify-center transition-all font-bold
                                ${compact ? 'rounded-md text-[10px]' : 'rounded-2xl text-sm'}
                                ${!isSameMonth(day, currentMonth) ? 'text-gray-200' : 'text-gray-600'}
                                ${isSelected ? 'bg-rose-600 text-white shadow-lg shadow-rose-100 z-10' : 'hover:bg-gray-50 text-gray-700'}
                                ${isToday(day) && !isSelected ? 'text-rose-600 ring-2 ring-rose-100' : ''}
                            `}
                        >
                            {format(day, 'd')}
                            {dayDebts.length > 0 && !isSelected && (
                                <span className={`absolute ${compact ? 'bottom-1 h-1 w-1' : 'bottom-2 h-1.5 w-1.5'} rounded-full bg-rose-500 ring-2 ring-white shadow-sm`} />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className={`${compact ? 'mt-3 pt-3' : 'mt-8 pt-6'} border-t border-gray-50 flex-1`}>
                <h4 className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-black text-gray-400 uppercase tracking-[0.2em] ${compact ? 'mb-2' : 'mb-4'}`}>
                    Hạn thanh toán: {format(selectedDate, 'dd/MM/yyyy')}
                </h4>
                <div className={`space-y-2 overflow-y-auto pr-2 custom-scrollbar ${compact ? 'max-h-[58px]' : 'max-h-[160px]'}`}>
                    <AnimatePresence mode="popLayout">
                        {selectedDebts.length > 0 ? selectedDebts.map(debt => (
                            <motion.div
                                whileHover={{ x: 5 }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={debt.id}
                                className={`w-full text-left bg-gray-50/50 border border-gray-100/50 flex items-center justify-between group ${compact ? 'p-2 rounded-lg gap-2' : 'p-3 rounded-xl gap-3'}`}
                            >
                                <div className={`flex items-center min-w-0 ${compact ? 'gap-2' : 'gap-3'}`}>
                                    <div className={`${compact ? 'w-6 h-6 rounded-md' : 'w-8 h-8 rounded-lg'} bg-white text-rose-400 shadow-sm flex items-center justify-center`}>
                                        <DollarSign className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-gray-900 truncate`}>{debt.name}</p>
                                        <p className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-gray-400 font-medium uppercase truncate`}>{debt.customerName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-black text-rose-600`}>{formatCurrency(debt.remaining)}</p>
                                </div>
                            </motion.div>
                        )) : (
                            <div className={`text-center text-gray-400 italic ${compact ? 'py-3 text-[10px]' : 'py-6 text-xs'}`}>Không có kế hoạch thanh toán nào cho ngày này</div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
