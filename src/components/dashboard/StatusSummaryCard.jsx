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
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            whileHover={{ y: -5, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
            className={`p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-center items-center text-center transition-all ${style.light}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/80 backdrop-blur-sm shadow-sm ${style.icon}`}>
                {Icon && <Icon className="w-5 h-5" />}
            </div>
            <h4 className="text-3xl font-black tracking-tight leading-none mb-1">{count}</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">{label}</p>
        </motion.div>
    );
};
