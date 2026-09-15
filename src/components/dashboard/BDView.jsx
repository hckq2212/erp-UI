import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    Briefcase,
    FileText,
    Target,
    TrendingUp,
    Users,
    WalletCards,
} from 'lucide-react';
import { DebtCalendar } from './DebtCalendar';
import { MetricCard } from './member/MetricCard';
import { TEAM_MEMBER_ROLE_LABELS, USER_ROLE } from '../../utils/enums';

const formatCompactCurrency = (value = 0) => {
    const amount = Number(value || 0);
    if (!amount) return '0';

    return new Intl.NumberFormat('vi-VN', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount);
};

const BDFocusCard = ({
    totalCustomers = 0,
    totalOpportunities = 0,
    totalExpectedRevenue = 0,
    totalDebt = 0,
    onViewOpportunities,
}) => (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-[#FFE6D5] bg-gradient-to-br from-[#FFF6EF] via-[#FFEBE0] to-[#FFDBC4] p-5 text-[#1A1A1A] shadow-xl shadow-orange-100/40">
        <svg className="absolute bottom-0 right-0 z-0 h-[350px] w-[550px] pointer-events-none opacity-80" viewBox="0 0 500 300" fill="none">
            <path d="M0 300C120 230 250 290 500 160V300H0Z" fill="url(#bd-wave-grad)" />
            <defs>
                <linearGradient id="bd-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFEADA" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FFC8A6" stopOpacity="0.6" />
                </linearGradient>
            </defs>
        </svg>
        <svg className="absolute top-0 right-0 z-0 h-[180px] w-[280px] pointer-events-none opacity-40" viewBox="0 0 300 200" fill="none">
            <path d="M80 0C140 70 200 40 300 100V0H80Z" fill="url(#bd-top-wave-grad)" />
            <defs>
                <linearGradient id="bd-top-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2E8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FFE2CD" stopOpacity="0.7" />
                </linearGradient>
            </defs>
        </svg>

        <div className="relative z-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
            <div className="space-y-15 lg:col-span-8">
                <div>
                    {/* <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6633]">BD FOCUS</p> */}
                    <h2 className="text-2xl font-semibold leading-tight tracking-tight text-[#1A1A1A] sm:text-3xl">
                        Bám sát khách hàng,<br />đẩy nhanh cơ hội thành hợp đồng
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={onViewOpportunities}
                        className="flex items-center gap-3 rounded-xl border border-orange-50/50 bg-white p-4 text-left shadow-md shadow-orange-100/40 transition hover:scale-[1.03]"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 shadow-inner">
                            <Target size={18} />
                        </div>
                        <div>
                            <span className="block text-2xl font-black leading-tight text-[#1A1A1A]">{totalOpportunities}</span>
                            <p className="text-[10px] font-bold leading-tight text-gray-500">Cơ hội</p>
                            <span className="text-[9px] font-bold text-orange-500">Theo dõi pipeline</span>
                        </div>
                    </button>

                    <div className="flex items-center gap-3 rounded-xl border border-orange-50/50 bg-white p-4 shadow-md shadow-orange-100/40 transition hover:scale-[1.03]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-inner">
                            <Users size={18} />
                        </div>
                        <div>
                            <span className="block text-2xl font-black leading-tight text-[#1A1A1A]">{totalCustomers}</span>
                            <p className="text-[10px] font-bold leading-tight text-gray-500">Khách hàng</p>
                            <span className="text-[9px] font-bold text-blue-500">Cần chăm sóc</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-orange-50/50 bg-white p-4 shadow-md shadow-orange-100/40 transition hover:scale-[1.03]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500 shadow-inner">
                            <WalletCards size={18} />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-2xl font-black leading-tight text-[#1A1A1A]">{formatCompactCurrency(totalDebt)}</span>
                            <p className="text-[10px] font-bold leading-tight text-gray-500">Công nợ</p>
                            <span className="text-[9px] font-bold text-amber-500">Cần thu hồi</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden justify-center lg:col-span-4 lg:flex">
                <div className="flex h-56 w-56 items-center justify-center rounded-full border-4 border-white bg-white shadow-xl shadow-orange-100/50">
                    <div className="text-center">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Doanh thu kỳ vọng</p>
                        <p className="text-4xl font-black tracking-tighter text-[#FF511A]">{formatCompactCurrency(totalExpectedRevenue)}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Từ cơ hội</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const BDProjectList = ({ projects = [], navigate }) => (
    <div className="h-full rounded-[1rem] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-500">
                    <Briefcase size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-black tracking-tight text-slate-900">Dự án liên quan</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Từ khách hàng phụ trách</p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => navigate('/projects')}
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-emerald-500"
            >
                Xem tất cả <ArrowUpRight size={10} />
            </button>
        </div>

        <div className="space-y-3">
            {projects.length > 0 ? (
                projects.slice(0, 6).map((project, index) => {
                    const roleLabel = TEAM_MEMBER_ROLE_LABELS[project.role] || USER_ROLE[project.role] || project.role || 'Kinh doanh';

                    return (
                        <motion.button
                            type="button"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="group grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-4 text-left transition hover:border-emerald-100 hover:bg-white hover:shadow-md"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="truncate text-[11px] font-black uppercase tracking-tight text-slate-900 group-hover:text-emerald-600">
                                        {project.name || 'Dự án chưa đặt tên'}
                                    </h4>
                                    {roleLabel && (
                                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-orange-50 text-[#F38820] border border-orange-100 shrink-0">
                                            {roleLabel}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 truncate text-[9px] font-bold uppercase text-slate-400">
                                    Khách: {project.customerName || 'N/A'}
                                </p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition group-hover:text-emerald-600">
                                <ArrowUpRight size={16} />
                            </div>
                        </motion.button>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                    <Briefcase className="h-9 w-9 text-slate-300" />
                    <p className="text-xs font-bold italic text-slate-400">Chưa có dự án nào liên quan</p>
                </div>
            )}
        </div>
    </div>
);

export const BDView = ({ dashboard, navigate }) => {
    const sale = dashboard?.sale || {};
    const projects = sale.projects || [];
    const upcomingDebts = sale.upcomingDebts || [];

    return (
        <div className="space-y-3 pb-20">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
                <div className="lg:col-span-12">
                    <BDFocusCard
                        totalCustomers={sale.totalCustomers ?? 0}
                        totalOpportunities={sale.totalOpportunities ?? 0}
                        totalExpectedRevenue={sale.totalExpectedRevenue ?? 0}
                        totalDebt={sale.totalDebt ?? 0}
                        onViewOpportunities={() => navigate('/opportunities')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
                <MetricCard title="Khách hàng" value={sale.totalCustomers ?? 0} icon={Users} color="blue" sparklineData={[]} />
                <MetricCard title="Cơ hội" value={sale.totalOpportunities ?? 0} icon={Target} color="purple" sparklineData={[]} />
                <MetricCard title="Doanh thu kỳ vọng" value={formatCompactCurrency(sale.totalExpectedRevenue)} icon={TrendingUp} color="emerald" sparklineData={[]} />
                <MetricCard title="Công nợ" value={formatCompactCurrency(sale.totalDebt)} icon={WalletCards} color="orange" sparklineData={[]} />
                <MetricCard title="Dự án liên quan" value={projects.length} icon={FileText} color="sky" sparklineData={[]} />
            </div>

            <div className="grid grid-cols-1 items-stretch gap-2 lg:grid-cols-12">
                <div className="lg:col-span-9">
                    <BDProjectList projects={projects} navigate={navigate} />
                </div>
                <div className="lg:col-span-3">
                    <DebtCalendar debts={upcomingDebts} compact />
                </div>
            </div>
        </div>
    );
};
