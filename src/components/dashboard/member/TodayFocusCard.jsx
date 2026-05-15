import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Clock, Hourglass } from 'lucide-react';

export const TodayFocusCard = ({ 
    overdueCount = 0, 
    todayCount = 0, 
    pendingCount = 0, 
    progress = 72,
    onViewDetail 
}) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2rem] p-8 text-white shadow-lg shadow-orange-200/50">
            {/* Background Decorative Circles */}
            <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-black/5 rounded-full blur-2xl" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                    <div>
                        <p className="text-orange-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">TODAY FOCUS</p>
                        <h2 className="text-3xl font-black leading-tight tracking-tight">
                            Tập trung để tạo ra<br />những điều khác biệt! 🔥
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {/* Overdue */}
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex-1 min-w-[120px] border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={14} className="text-orange-100" />
                                <span className="text-2xl font-black">{overdueCount}</span>
                            </div>
                            <p className="text-[9px] font-bold text-orange-50 uppercase leading-tight">
                                Task overdue<br />
                                <span className="text-orange-200 font-normal normal-case">Cần xử lý ngay</span>
                            </p>
                        </div>

                        {/* Today Deadlines */}
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex-1 min-w-[120px] border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-orange-100" />
                                <span className="text-2xl font-black">{todayCount}</span>
                            </div>
                            <p className="text-[9px] font-bold text-orange-50 uppercase leading-tight">
                                Deadline hôm nay<br />
                                <span className="text-orange-200 font-normal normal-case">Đừng bỏ lỡ nhé!</span>
                            </p>
                        </div>

                        {/* Pending Projects */}
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex-1 min-w-[120px] border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Hourglass size={14} className="text-orange-100" />
                                <span className="text-2xl font-black">{pendingCount}</span>
                            </div>
                            <p className="text-[9px] font-bold text-orange-50 uppercase leading-tight">
                                Dự án chờ duyệt<br />
                                <span className="text-orange-200 font-normal normal-case">Khách đang chờ</span>
                            </p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onViewDetail}
                        className="flex items-center gap-2 bg-orange-700/30 hover:bg-orange-700/50 transition-colors px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10"
                    >
                        Xem chi tiết <ArrowRight size={14} />
                    </motion.button>
                </div>

                {/* Progress Circle Section */}
                <div className="hidden lg:flex justify-center items-center relative">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        {/* Circular Progress SVG */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="80"
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth="12"
                                fill="transparent"
                            />
                            <motion.circle
                                cx="96"
                                cy="96"
                                r="80"
                                stroke="white"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 80}
                                initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - progress / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black tracking-tighter">{progress}%</span>
                            <span className="text-[10px] font-bold text-orange-100 uppercase tracking-widest">Tiến độ tổng thể</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
