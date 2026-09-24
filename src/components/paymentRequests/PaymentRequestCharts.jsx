import { useMemo } from 'react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import { APPROVAL_LABELS } from './paymentRequestConfig';

const STATUS_COLORS = {
    DRAFT: '#a8a29e',
    PENDING_REVIEWER: '#fbbf24',
    NEED_MORE_DOCS: '#f97316',
    PENDING_BOD: '#eab308',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
    CANCELLED: '#d6d3d1',
};

const ACTIVE_STATUSES = ['PENDING_REVIEWER', 'NEED_MORE_DOCS', 'PENDING_BOD', 'APPROVED'];

const MONTH_LABEL = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

// Nhãn rút gọn cho trục biểu đồ (vd: 1,2tr / 500k) — formatCurrency đầy đủ quá dài để hiện trên axis.
const compactVnd = (value) => {
    const n = Number(value || 0);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return `${n}`;
};

const ChartCard = ({ title, children }) => (
    <div className='rounded-2xl border border-orange-100 bg-white p-5 shadow-sm'>
        <p className='mb-3 text-sm font-semibold text-stone-700'>{title}</p>
        <div className='h-64 w-full'>{children}</div>
    </div>
);

export const PaymentRequestCharts = ({ requests, projectNameById }) => {
    const statusData = useMemo(() => {
        const counts = {};
        requests.forEach((r) => {
            counts[r.approvalStatus] = (counts[r.approvalStatus] || 0) + 1;
        });
        return Object.entries(counts)
            .filter(([, value]) => value > 0)
            .map(([key, value]) => ({ key, name: APPROVAL_LABELS[key] || key, value }));
    }, [requests]);

    const topProjects = useMemo(() => {
        const sums = new Map();
        requests
            .filter((r) => ACTIVE_STATUSES.includes(r.approvalStatus))
            .forEach((r) => {
                const projectId = r.projectId || r.project?.id;
                if (!projectId) return;
                const name = r.project?.name || projectNameById.get(String(projectId)) || 'Không rõ';
                sums.set(name, (sums.get(name) || 0) + Number(r.amount || 0));
            });
        return Array.from(sums.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);
    }, [requests, projectNameById]);

    const monthlyTrend = useMemo(() => {
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return { key: MONTH_LABEL(d), month: d.getMonth(), year: d.getFullYear(), paid: 0, unpaid: 0 };
        });
        requests.forEach((r) => {
            if (['REJECTED', 'CANCELLED'].includes(r.approvalStatus)) return;
            const created = new Date(r.createdAt);
            const bucket = months.find((m) => m.month === created.getMonth() && m.year === created.getFullYear());
            if (!bucket) return;
            if (r.paymentStatus === 'PAID') bucket.paid += Number(r.amount || 0);
            else bucket.unpaid += Number(r.amount || 0);
        });
        return months;
    }, [requests]);

    if (!requests.length) return null;

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <ChartCard title='Tỷ lệ yêu cầu theo trạng thái duyệt'>
                <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                        <Pie data={statusData} dataKey='value' nameKey='name' innerRadius={45} outerRadius={75} paddingAngle={2}>
                            {statusData.map((entry) => (
                                <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#a8a29e'} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} yêu cầu`]} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title='Top dự án theo chi phí phát sinh (chưa hủy/từ chối)'>
                <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={topProjects} layout='vertical' margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                        <XAxis type='number' tickFormatter={compactVnd} tick={{ fontSize: 11 }} />
                        <YAxis type='category' dataKey='name' width={110} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey='amount' fill='#f97316' radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title='Chi phí phát sinh theo tháng (6 tháng gần nhất)'>
                <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray='3 3' vertical={false} />
                        <XAxis dataKey='key' tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={compactVnd} tick={{ fontSize: 11 }} width={50} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey='paid' name='Đã thanh toán' stackId='a' fill='#10b981' radius={[4, 4, 0, 0]} />
                        <Bar dataKey='unpaid' name='Chưa thanh toán' stackId='a' fill='#f97316' radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};
