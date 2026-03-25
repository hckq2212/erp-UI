import React from 'react';

export const StatusMiniCard = ({ label, count, color }) => {
    const colors = {
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    };
    return (
        <div className={`p-4 rounded-3xl border text-center ${colors[color]}`}>
            <p className="text-lg text-gray-400 font-black">{count}</p>
            <p className="text-[8px] uppercase tracking-tighter opacity-70 font-black">{label}</p>
        </div>
    );
};
