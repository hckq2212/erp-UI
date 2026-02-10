import React from 'react';
import {
    DollarSign, Briefcase, Rocket, AlertCircle,
    Users, TrendingUp, CheckCircle2, Clock,
    ArrowUpRight, Target, Activity, Calendar, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '../../api/auth';
import { useGetDashboardDataQuery } from '../../api/dashboard';
import { useGetTasksQuery } from '../../api/tasks';
import { OPPORTUNITY_STATUS_LABELS, PROJECT_STATUS_LABELS } from '../../utils/enums';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboardDataQuery();
    const { data: awaitingReviewTasks, isLoading: isTasksLoading } = useGetTasksQuery({ status: 'AWAITING_REVIEW' });

    const isLoading = isDashboardLoading || isTasksLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!dashboard) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // --- Admin Dashboard Section ---
    const AdminView = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-gray-400">
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
        </div>
    );

    // --- Team Lead Dashboard Section ---
    const TeamLeadView = () => (
        <div className="space-y-6">
            <h2 className="text-xl text-blue-500 font-bold flex items-center gap-2">
                <Rocket className="w-6 h-6 text-blue-500" />
                Dự án đang quản lý
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboard.teamLead?.map(project => (
                    <div key={project.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{project.name}</h3>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border mt-1 inline-block ${project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                    }`}>
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">{project.progress}%</p>
                                <p className="text-[10px] text-gray-400  uppercase">Tiến độ</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full mb-6 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className=" text-gray-600">{project.completedTaskCount}/{project.taskCount} Tasks</span>
                            </div>
                            <button className="text-blue-600 font-black text-xs uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all">
                                Chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- Sale Dashboard Section ---
    const SaleView = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
                    <Target className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <p className="text-emerald-100 font-black uppercase tracking-widest text-xs mb-2">Doanh thu dự kiến</p>
                    <h3 className="text-4xl font-black mb-6">{formatCurrency(dashboard.sale?.totalExpectedRevenue)}</h3>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-4 py-2 rounded-2xl border border-white/10">
                        <TrendingUp className="w-4 h-4" />
                        <span className="">{dashboard.sale?.totalOpportunities} Cơ hội</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Trạng thái cơ hội</h3>
                    <div className="space-y-4">
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
        </div>
    );

    // --- Member Dashboard Section ---
    const MemberView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 text-center">Tóm tắt công việc</h3>
                    <div className="flex justify-center mb-8 relative">
                        <div className="w-40 h-40 rounded-full border-[10px] border-blue-50 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-blue-600">{dashboard.member?.totalTasks}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tổng Task</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <StatusMiniCard label="Chưa Bắt Đầu" count={dashboard.member?.pendingCount} color="amber" />
                        <StatusMiniCard label="Đang Làm" count={dashboard.member?.doingCount} color="blue" />
                        <StatusMiniCard label="Đã Hoàn Thành" count={dashboard.member?.completedCount} color="green" />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-600">Deadline sắp tới</h3>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {dashboard.member?.upcomingDeadlines?.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-rose-500 transition-colors">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-900">{task.name}</h4>
                                        <p className="text-xs text-rose-500  uppercase tracking-tighter">Deadline: {task.deadline}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${task.status === 'DOING' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Tasks Awaiting Review Section ---
    const ReviewQueueView = () => {
        const myReviewTasks = awaitingReviewTasks?.data?.filter(task =>
            Number(user?.id) === Number(task.assignerId) || Number(user?.id) === Number(task.project?.team?.teamLead?.id)
        ) || [];

        if (myReviewTasks.length === 0) return null;

        return (
            <div className="space-y-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Việc cần duyệt</h2>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Bạn có {myReviewTasks.length} công việc đang chờ đánh giá</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myReviewTasks.map(task => (
                        <div key={task.id} className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform" />
                            <div className="relative">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase">
                                        {task.code}
                                    </span>
                                    <span className="text-[10px] text-gray-400 uppercase">
                                        {task.project?.name}
                                    </span>
                                </div>
                                <h3 className="text-blue-600 mb-4 line-clamp-1">{task.name}</h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 border border-white shadow-sm shrink-0">
                                            {task.assignee?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 uppercase leading-none mb-0.5">Người thực hiện</p>
                                            <p className="text-xs text-gray-700 truncate">{task.assignee?.fullName || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/tasks/${task.id}/review`)}
                                        className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Xin chào, {user?.fullName?.split(' ').pop()} 👋</h1>
                    <p className="text-gray-500 font-medium mt-1">Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            <ReviewQueueView />

            {dashboard.admin && <AdminView />}
            {dashboard.teamLead && <TeamLeadView />}
            {dashboard.sale && <SaleView />}
            {dashboard.member && <MemberView />}
        </div>
    );
};

// --- Sub-components for cleaner code ---

const StatCard = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-50',
        purple: 'text-purple-600 bg-purple-50 border-purple-100 shadow-purple-50',
        green: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-50',
        red: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-50',
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-blue-600 transition-colors">{value}</h4>
        </div>
    );
};

const StatusMiniCard = ({ label, count, color }) => {
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

