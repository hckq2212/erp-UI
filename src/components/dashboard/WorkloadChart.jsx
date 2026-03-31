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
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-900 text-white px-2 py-1 rounded-md text-[9px] font-bold shadow-xl">
                                            {payload[0].value} task được nghiệm thu
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 4, 4]}
                            barSize={20}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.count > 0 ? '#6366f1' : '#f1f5f9'}
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
