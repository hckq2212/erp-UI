import React from 'react';
import { motion } from 'framer-motion';

export const MetricCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    color = 'blue',
    sparklineData = [10, 40, 30, 50, 40, 70, 60], // Dummy path data
    trendColor = 'text-emerald-500'
}) => {
    const colorStyles = {
        blue: {
            bg: 'bg-blue-50',
            icon: 'text-blue-500',
            stroke: '#3b82f6'
        },
        emerald: {
            bg: 'bg-emerald-50',
            icon: 'text-emerald-500',
            stroke: '#10b981'
        },
        purple: {
            bg: 'bg-purple-50',
            icon: 'text-purple-500',
            stroke: '#a855f7'
        },
        orange: {
            bg: 'bg-orange-50',
            icon: 'text-orange-500',
            stroke: '#f97316'
        },
        sky: {
            bg: 'bg-sky-50',
            icon: 'text-sky-500',
            stroke: '#0ea5e9'
        }
    };

    const style = colorStyles[color] || colorStyles.blue;

    // Generate a simple SVG path for sparkline
    const generatePath = (data) => {
        if (!data || data.length === 0) return "";
        const width = 100;
        const height = 30;
        const step = width / (data.length - 1);
        return data.map((val, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (val / 100) * height}`).join(' ');
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden relative group"
        >
            <div className="flex items-start mb-3 gap-3">
                <div className={`p-3 rounded-2xl ${style.bg} ${style.icon} mr-4`}>
                    <Icon size={20} strokeWidth={2.5} />

                </div>
                <div className="flex flex-col text-left items-baseline gap-2">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
                </div>
            </div>

            {/* <div className="space-y-1 relative z-10">

                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
                </div>
                {subValue && (
                    <p className={`text-[10px] font-bold ${trendColor}`}>
                        {subValue}
                    </p>
                )}
            </div> */}

            {/* Sparkline */}
            {/* <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 group-hover:opacity-60 transition-opacity">
                <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                        d={generatePath(sparklineData)}
                        fill="none"
                        stroke={style.stroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </div> */}
        </motion.div>
    );
};
