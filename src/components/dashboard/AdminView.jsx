import React from 'react';
import { DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/format';

export const AdminView = ({ dashboard }) => {
    if (!dashboard?.admin) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
                title="Doanh thu"
                value={formatCurrency(dashboard.admin?.totalRevenue)}
                icon={DollarSign}
                color="blue"
            />
            <StatCard
                title="Tổng khách hàng"
                value={dashboard.admin?.totalCustomers}
                icon={Users}
                color="purple"
            />
            <StatCard
                title="Khách hàng mới"
                value={dashboard.admin?.newCustomers}
                icon={TrendingUp}
                color="green"
            />
            <StatCard
                title="Tổng công nợ"
                value={formatCurrency(dashboard.admin?.totalDebt)}
                icon={AlertCircle}
                color="red"
            />
        </div>
    );
};
