import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, icon: Icon, color, className = "" }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/20',
        purple: 'text-purple-600 bg-purple-50 border-purple-100 shadow-purple-100/20',
        green: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/20',
        red: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/20',
    };

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className={`group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-gray-200/50 h-fit ${className}`}
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 shadow-lg ${colors[color]}`}>
                <Icon className="w-7 h-7" />
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-2 px-1">{title}</p>
            <h4 className="text-3xl font-black text-gray-900 tracking-tight px-1 group-hover:text-blue-600 transition-colors truncate">{value}</h4>

            <div className={`absolute top-8 right-8 w-2 h-2 rounded-full opacity-30 ${colors[color].split(' ')[1]}`} />
        </motion.div>
    );
};
