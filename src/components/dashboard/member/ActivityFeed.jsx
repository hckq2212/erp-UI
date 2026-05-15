import React from 'react';
import { motion } from 'framer-motion';

export const ActivityFeed = ({ notifications = [] }) => {
    // Take the 5 most recent notifications
    const displayNotifications = notifications.slice(0, 5);

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Hoạt động gần đây</h3>
                <button className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Xem tất cả</button>
            </div>

            <div className="space-y-6">
                {displayNotifications.length > 0 ? (
                    displayNotifications.map((noti, index) => (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={noti.id} 
                            className="flex items-start gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border-2 border-white shadow-sm overflow-hidden shrink-0">
                                {noti.fromUser?.avatar ? (
                                    <img src={noti.fromUser.avatar} alt={noti.fromUser.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{noti.fromUser?.fullName?.substring(0, 1) || 'S'}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] leading-relaxed">
                                    <span className="font-black text-slate-900">{noti.fromUser?.fullName || 'Hệ thống'}</span>{' '}
                                    <span className="text-slate-500 font-medium">{noti.title || 'Thông báo mới'}</span>{' '}
                                    <span className="font-black text-slate-800">{noti.message}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase">
                                        {noti.createdAt ? new Date(noti.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 italic text-xs gap-3">
                        <p className="uppercase tracking-widest font-bold">Chưa có hoạt động</p>
                    </div>
                )}
            </div>
        </div>
    );
};
