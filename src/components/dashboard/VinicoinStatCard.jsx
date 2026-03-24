import React from 'react';
import { Star, TrendingUp, History, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export const VinicoinStatCard = ({ amount = 0, completedCount = 0 }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-amber-100 relative overflow-hidden group border-4 border-white"
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <Coins className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-white/80">Quỹ Thưởng Cá Nhân</span>
                    </div>
                </div>

                <div className="space-y-1 mb-8">
                    <h3 className="text-5xl font-black tracking-tight flex items-center gap-3">
                        {amount.toLocaleString()}
                        <span className="text-lg font-black text-white/60 tracking-normal">VC</span>
                    </h3>
                    <p className="text-xs font-bold text-white/70 uppercase">Vinicoin hiện có</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 opacity-70" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/70">Hoàn thành</span>
                        </div>
                        <p className="text-lg font-black">{completedCount}</p>
                        <p className="text-[10px] opacity-60">Công việc được thưởng</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-center items-center cursor-pointer hover:bg-white/20 transition-all">
                        <History className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-black uppercase">Lịch sử</span>
                    </div>
                </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl"></div>
            <Star className="absolute top-8 right-8 w-12 h-12 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
        </motion.div>
    );
};
