import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const WorkloadChart = ({ data = [] }) => {
    return (
        <div className="h-full flex flex-col">
            <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Số task được nghiệm thu theo tháng</h3>

            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }}
                            tickFormatter={(val) => val}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white/90 backdrop-blur-md border border-slate-100 px-3 py-2 rounded-xl text-[10px] font-black shadow-xl ring-1 ring-black/5">
                                            <span className="text-emerald-600">{payload[0].value}</span>
                                            <span className="text-slate-400 ml-1 uppercase tracking-tighter">task được nghiệm thu</span>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[6, 6, 0, 0]}
                            barSize={24}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.count > 0 ? '#10b981' : '#f1f5f9'}
                                    className="transition-all hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
