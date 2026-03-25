import React from 'react';
import { Users, Briefcase, ArrowUpRight } from 'lucide-react';
import { StatCard } from './StatCard';
import { DebtCalendar } from './DebtCalendar';
import { OPPORTUNITY_STATUS_LABELS } from '../../utils/enums';

export const BDView = ({ dashboard, navigate }) => {
    if (!dashboard?.sale) return null;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <StatCard
                    title="Khách hàng của tôi"
                    value={dashboard.sale?.totalCustomers}
                    icon={Users}
                    color="purple"
                    className="lg:col-span-3 md:col-span-2"
                />
                <div className="lg:col-span-2 md:col-span-4 h-fit bg-white p-8 rounded-[2.5rem] justify-start border border-gray-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Trạng thái cơ hội</h3>
                    <div className="space-y-4 px-1">
                        {Object.entries(dashboard.sale?.statusCounts || {}).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${status === 'CONTRACT_CREATED' ? 'bg-blue-500' :
                                        status === 'PROJECT_ASSIGNED' ? 'bg-purple-500' : 'bg-amber-500'
                                        }`} />
                                    <span className="text-sm font-bold text-gray-600 capitalize">{OPPORTUNITY_STATUS_LABELS[status]}</span>
                                </div>
                                <span className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-xl">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-start">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Dự án liên quan</h3>
                    {dashboard.sale?.projects?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                            {dashboard.sale.projects.map(project => (
                                <div key={project.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-gray-200 transition-all group">
                                    <div className="min-w-0">
                                        <h4 className="text-gray-900 font-black truncate text-sm mb-1">{project.name}</h4>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Khách: {project.customerName || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                            className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm group-hover:shadow-md"
                                        >
                                            <ArrowUpRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400 italic text-xs font-medium">Chưa có dự án nào liên quan</p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 md:col-span-4">
                    <DebtCalendar debts={dashboard.sale?.upcomingDebts} />
                </div>
            </div>
        </div>
    );
};
