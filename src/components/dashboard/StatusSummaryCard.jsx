import React from 'react';
import { motion } from 'framer-motion';

export const StatusSummaryCard = ({ label, count, color, icon: Icon }) => {
    const colorStyles = {
        blue: {
            bg: 'bg-blue-600',
            light: 'bg-blue-50/50 text-blue-700 border-blue-100',
            icon: 'text-blue-600 shadow-blue-100'
        },
        amber: {
            bg: 'bg-amber-600',
            light: 'bg-amber-50/50 text-amber-700 border-amber-100',
            icon: 'text-amber-600 shadow-amber-100'
        },
        green: {
            bg: 'bg-emerald-600',
            light: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
            icon: 'text-emerald-600 shadow-emerald-100'
        },
        rose: {
            bg: 'bg-rose-600',
            light: 'bg-rose-50/50 text-rose-700 border-rose-100',
            icon: 'text-rose-600 shadow-rose-100'
        },
        purple: {
            bg: 'bg-purple-600',
            light: 'bg-purple-50/50 text-purple-700 border-purple-100',
            icon: 'text-purple-600 shadow-purple-100'
        },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            whileHover={{ y: -5, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)' }}
            className={`p-4 rounded-[2rem] border shadow-sm flex items-center gap-4 transition-all duration-300 ${style.light}`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm ${style.icon} shrink-0`}>
                {Icon && <Icon className="w-6 h-6" />}
            </div>
            <div className="flex flex-col text-left">
                <h4 className="text-2xl font-extrabold tracking-tight leading-none mb-1.5">{count}</h4>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 leading-none">{label}</p>
            </div>
        </motion.div>
    );
};
