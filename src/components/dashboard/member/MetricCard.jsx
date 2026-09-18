import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export const MetricCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    color = 'blue',
    sparklineData = [10, 40, 30, 50, 40, 70, 60], // Dummy path data
    trendColor = 'text-emerald-500',
    onClick
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
        },
        red: {
            bg: 'bg-red-50',
            icon: 'text-red-500',
            stroke: '#ef4444'
        },
        amber: {
            bg: 'bg-amber-50',
            icon: 'text-amber-500',
            stroke: '#f59e0b'
        },
        indigo: {
            bg: 'bg-indigo-50',
            icon: 'text-indigo-500',
            stroke: '#6366f1'
        }
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={onClick}
            className={`bg-white p-4 rounded-[0.75rem] border border-slate-100 shadow-sm overflow-hidden relative group ${
                onClick ? 'cursor-pointer hover:border-amber-300 hover:shadow-md transition-all' : ''
            }`}
        >
            <div className="flex items-start mb-3 gap-3">
                <div className={`p-3 rounded-lg ${style.bg} ${style.icon} mr-4 shrink-0`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col text-left items-baseline gap-2 min-w-0">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{title}</span>
                        {onClick && (
                            <ArrowUpRight
                                size={14}
                                className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-600"
                            />
                        )}
                    </p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
                </div>
            </div>
        </motion.div>
    );
};
