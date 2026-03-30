import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const WorkloadChart = ({ data = [] }) => {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">Năng suất làm việc tháng</h3>

            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            tickFormatter={(val) => `TH ${val}`}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xl">
                                            {payload[0].value} task được nghiệm thu
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[6, 6, 6, 6]}
                            barSize={32}
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

            <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Năm {new Date().getFullYear()}</span>
                <span>Tháng hiện tại: {new Date().getMonth() + 1}</span>
            </div>
        </div>
    );
};
