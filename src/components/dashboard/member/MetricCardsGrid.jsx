import React from 'react';
import { MetricCard } from './MetricCard';
import { Clock, CheckCircle2, Layers, Coins, TrendingUp } from 'lucide-react';

export const MetricCardsGrid = ({ member }) => {
    const statusCounts = member?.statusCounts || {};
    const completedCount = Number(statusCounts.COMPLETED || 0) + Number(statusCounts.ACCEPTED || 0) + Number(statusCounts.DONE || 0);
    const totalViniCoin = member?.vinicoinTotal?.toLocaleString() || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
                title="Đang thực hiện"
                value={member?.doingCount ?? 0}
                icon={Clock}
                color="blue"
                sparklineData={[]}
            />
            
            <MetricCard
                title="Đã nghiệm thu"
                value={completedCount}
                icon={CheckCircle2}
                color="emerald"
                sparklineData={[]}
            />

            <MetricCard
                title="Dự án tham gia"
                value={member?.participatingProjects?.length || 0}
                icon={Layers}
                color="purple"
                sparklineData={[]}
            />

            <MetricCard
                title="Vinicoin Tổng"
                value={totalViniCoin}
                icon={Coins}
                color="orange"
                sparklineData={[]}
            />

            <MetricCard
                title="Đã rút"
                value={member?.vinicoinWithdrawn?.toLocaleString() || 0}
                icon={TrendingUp}
                color="sky"
                sparklineData={[]}
            />
        </div>
    );
};
