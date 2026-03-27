import React, { useState } from 'react';
import { Calendar, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MonthSelector = ({ selectedDate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selectedDate.year || new Date().getFullYear());

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
        'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
        'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const isSelected = (m) => selectedDate.month === m && selectedDate.year === viewYear;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
            >
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Thời gian</p>
                    <p className="text-sm font-bold text-gray-900 leading-none">
                        {selectedDate.month ? `Tháng ${selectedDate.month}, ${selectedDate.year}` : 'Tất cả thời gian'}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-4 z-50"
                    >
                        <div className="flex items-center justify-between mb-4 px-2">
                            <button 
                                onClick={() => setViewYear(v => v - 1)}
                                className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-black text-gray-900 text-sm uppercase tracking-widest">{viewYear}</span>
                            <button 
                                onClick={() => setViewYear(v => v + 1)}
                                className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {months.map((name, index) => {
                                const m = index + 1;
                                const active = isSelected(m);
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            onChange({ month: m, year: viewYear });
                                            setIsOpen(false);
                                        }}
                                        className={`py-3 rounded-xl text-xs font-bold transition-all ${
                                            active 
                                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                                            : 'hover:bg-orange-50 text-gray-600 hover:text-orange-600'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="h-px bg-gray-50 my-4" />
                        
                        <button
                            onClick={() => {
                                onChange({ month: null, year: null });
                                setIsOpen(false);
                            }}
                            className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                        >
                            Tất cả thời gian
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
