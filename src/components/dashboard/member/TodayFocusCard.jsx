import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertCircle, Calendar, Hourglass, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

export const TodayFocusCard = ({
    overdueCount = 0,
    todayCount = 0,
    pendingCount = 0,
    progress = 72,
    selectedDate = new Date(),
    isToday = true,
    onResetToday,
    onViewDetail
}) => {
    const formattedSelectedDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
    const dateKey = format(formattedSelectedDate, 'yyyy-MM-dd');

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF6EF] via-[#FFEBE0] to-[#FFDBC4] rounded-[1.25rem] p-5 text-[#1A1A1A] shadow-xl shadow-orange-100/40 border border-[#FFE6D5] ">
            {/* Background Decorative Waves */}
            <svg className="absolute bottom-0 right-0 w-[550px] h-[350px] pointer-events-none z-0 opacity-80" viewBox="0 0 500 300" fill="none">
                <path d="M0 300C120 230 250 290 500 160V300H0Z" fill="url(#wave-grad)" />
                <defs>
                    <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFEADA" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FFC8A6" stopOpacity="0.6" />
                    </linearGradient>
                </defs>
            </svg>
            <svg className="absolute top-0 right-0 w-[280px] h-[180px] pointer-events-none z-0 opacity-40" viewBox="0 0 300 200" fill="none">
                <path d="M80 0C140 70 200 40 300 100V0H80Z" fill="url(#top-wave-grad)" />
                <defs>
                    <linearGradient id="top-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF2E8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FFE2CD" stopOpacity="0.7" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Flying Paper Plane Decorative SVG */}
            <svg className="absolute top-[38%] right-[42%] w-7 h-7 pointer-events-none z-0 text-[#FFA07A] opacity-75 transform rotate-[25deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
            </svg>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-8 space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#FF6633] text-[10px] font-black uppercase tracking-[0.2em]">
                                {isToday ? 'TODAY FOCUS' : `TIÊU ĐIỂM NGÀY ${format(formattedSelectedDate, 'dd/MM/yyyy')}`}
                            </span>
                            {!isToday && onResetToday && (
                                <button
                                    type="button"
                                    onClick={onResetToday}
                                    className="inline-flex items-center gap-1 text-[9px] font-bold text-orange-600 hover:text-orange-800 bg-orange-100/90 hover:bg-orange-200/90 px-2 py-0.5 rounded-full transition-all shadow-sm"
                                >
                                    <RotateCcw size={10} />
                                    <span>Về hôm nay</span>
                                </button>
                            )}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={`heading-${dateKey}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                                className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-[#1A1A1A]"
                            >
                                {isToday ? (
                                    <>Tập trung để tạo ra<br />những điều khác biệt! 🔥</>
                                ) : (
                                    <>Kế hoạch công việc<br />ngày {format(formattedSelectedDate, 'dd/MM')}! 🎯</>
                                )}
                            </motion.h2>
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Overdue Card */}
                        <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-md shadow-orange-100/40 border border-orange-50/50 hover:scale-[1.03] transition-all">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-500 shadow-inner flex-shrink-0">
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <span className="text-2xl font-black text-[#1A1A1A] leading-tight block">{overdueCount}</span>
                                <p className="text-[10px] font-bold text-gray-500 leading-tight">Task bị quá hạn</p>
                                <span className="text-[9px] font-bold text-red-500">Cần xử lý ngay</span>
                            </div>
                        </div>

                        {/* Selected Day Deadlines Card */}
                        <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-md shadow-orange-100/40 border border-orange-50/50 hover:scale-[1.03] transition-all">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-50 text-orange-500 shadow-inner flex-shrink-0">
                                <Calendar size={18} />
                            </div>
                            <div className="min-w-0">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={`count-${dateKey}-${todayCount}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-2xl font-black text-[#1A1A1A] leading-tight block"
                                    >
                                        {todayCount}
                                    </motion.span>
                                </AnimatePresence>
                                <p className="text-[10px] font-bold text-gray-500 leading-tight truncate">
                                    {isToday ? 'Deadline hôm nay' : `Hạn chót ${format(formattedSelectedDate, 'dd/MM')}`}
                                </p>
                                <span className="text-[9px] font-bold text-orange-500">
                                    {isToday ? 'Đừng bỏ lỡ nhé!' : (todayCount > 0 ? `Có ${todayCount} công việc` : 'Không có deadline')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 
                    <motion.button
                        whileHover={{ scale: 1.05, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onViewDetail}
                        className="group flex items-center gap-2 bg-[#FF511A] hover:bg-[#E0400C] text-white transition-all px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                    >
                        Xem chi tiết <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button> */}
                </div>

                {/* Glowing Progress Circle Section */}
                <div className="hidden lg:flex lg:col-span-4 justify-center items-center relative z-10">
                    <div className="relative w-56 h-56 rounded-full bg-white flex items-center justify-center shadow-xl shadow-orange-100/50 border-4 border-white">
                        <div className="relative w-44 h-44 flex items-center justify-center">
                            {/* Circular Progress SVG */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="88"
                                    cy="88"
                                    r="72"
                                    stroke="#FFF3EB"
                                    strokeWidth="10"
                                    fill="transparent"
                                />
                                <motion.circle
                                    cx="88"
                                    cy="88"
                                    r="72"
                                    stroke="#FF511A"
                                    strokeWidth="10"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 72}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - progress / 100) }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black tracking-tighter text-[#FF511A]">{progress}%</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tiến độ tổng thể</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

