import React from 'react';
import {
    DollarSign, Briefcase, Rocket, AlertCircle,
    Users, TrendingUp, CheckCircle2, Clock,
    ArrowUpRight, Target, Activity, Calendar, Eye,
    Sparkles, Zap, TrendingDown, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '../../api/auth';
import { useGetDashboardDataQuery } from '../../api/dashboard';
import { useGetTasksQuery } from '../../api/tasks';
import { getRemainingTime, formatCurrency } from '../../utils/format';
import { OPPORTUNITY_STATUS_LABELS, PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from '../../utils/enums';
import { VinicoinStatCard } from '../../components/dashboard/VinicoinStatCard';
import { TaskCalendar } from '../../components/dashboard/TaskCalendar';
import { WorkloadChart } from '../../components/dashboard/WorkloadChart';
import { MemberProjectList } from '../../components/dashboard/MemberProjectList';

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


    const AdminView = () => (
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

    const TeamLeadView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dashboard.teamLead?.map((project, idx) => (
                <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ y: -8 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-110 transition-transform" />

                    <div className="relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-black text-gray-900 text-xl group-hover:text-indigo-600 transition-colors line-clamp-1">{project.name}</h3>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border mt-2 inline-block tracking-tighter ${project.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                    }`}>
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-gray-900 leading-none">{project.progress}%</div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tiến độ</p>
                            </div>
                        </div>

                        <div className="w-full bg-gray-100 h-3 rounded-full mb-8 overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-gray-600">{project.completedTaskCount}/{project.taskCount} <span className="text-[10px] font-black uppercase opacity-60">Tasks</span></span>
                            </div>
                            <motion.button
                                whileHover={{ x: 3 }}
                                className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.1em] flex items-center gap-2 hover:text-indigo-700 transition-colors"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                Quản lý <ArrowUpRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    // --- Sale Dashboard Section ---
    const SaleView = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
                    {/* <Target className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform duration-700" /> */}
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

    const MemberView = () => (
        <div className="space-y-10 pb-12">
            {/* Top Row: Quick Stats & Vinicoin */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
            </motion.div>

            {/* Middle Row: Calendar & Deadlines */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                <div className="lg:col-span-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Deadline sắp tới</h3>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {dashboard.member?.upcomingDeadlines?.length > 0 ? dashboard.member.upcomingDeadlines.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white transition-all group w-full"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="text-left min-w-0">
                                            <h4 className="text-gray-900 font-bold truncate">{task.name}</h4>
                                            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-tighter truncate">
                                                Dự án: <span className="text-gray-600">{task.projectName || 'Công việc nội bộ'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className={`text-[10px] font-black uppercase leading-tight ${getRemainingTime(task.deadline, task.status).color}`}>
                                            {getRemainingTime(task.deadline, task.status).text}
                                        </p>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border mt-1 inline-block ${task.status === 'DOING' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                            }`}>
                                            {TASK_STATUS_LABELS[task.status]}
                                        </span>
                                    </div>
                                </button>
                            )) : (
                                <div className="text-center py-12 text-gray-400 italic text-sm">Chưa có deadline nào sắp tới</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <TaskCalendar tasks={dashboard.member?.calendarTasks} />
                </div>
            </motion.div>

            {/* Bottom Row: Projects & Productivity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                <div className="lg:col-span-4">
                    <MemberProjectList projects={dashboard.member?.participatingProjects} />
                </div>
                <div className="lg:col-span-8">
                    <WorkloadChart data={dashboard.member?.completionStats} />
                </div>
            </motion.div>
        </div>
    );

    // --- Tasks Awaiting Review Section ---
    const ReviewQueueView = () => {
        const myReviewTasks = awaitingReviewTasks?.data?.filter(task =>
            user?.id === task.assignerId || user?.id === task.project?.team?.teamLead?.id
        ) || [];

        if (myReviewTasks.length === 0) return null;

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Việc cần duyệt</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bạn đang có {myReviewTasks.length} công việc cần phản hồi</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myReviewTasks.map(task => (
                        <motion.div
                            key={task.id}
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-[2.5rem] border border-amber-100 shadow-sm hover:shadow-xl hover:shadow-amber-50 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform" />
                            <div className="relative">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-tighter">
                                        {task.code}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                        {task.project?.name}
                                    </span>
                                </div>
                                <h3 className="text-gray-900 font-black mb-4 line-clamp-1 group-hover:text-amber-600 transition-colors">{task.name}</h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-white shadow-sm shrink-0 uppercase">
                                            {task.assignee?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 font-black uppercase leading-none mb-1">Thành viên</p>
                                            <p className="text-xs text-gray-800 font-bold truncate">{task.assignee?.fullName || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => navigate(`/tasks/${task.id}/review`)}
                                        className="w-10 h-10 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-100 flex items-center justify-center transition-all"
                                    >
                                        <ArrowUpRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen pb-20">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-indigo-50/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-purple-50/30 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-10 max-w-[1600px] mx-auto pt-6 px-4 md:px-0"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3 mb-2"
                        >

                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest leading-none">
                                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </motion.div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                            Chào buổi chiều, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-black">{user?.fullName?.split(' ').pop() || 'bạn'}</span> 👋
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Chúc bạn một ngày làm việc hiệu quả và năng động!</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key="dashboard-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-12 pb-12"
                    >
                        <ReviewQueueView />

                        {dashboard.admin && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Hệ thống & Tài chính</h2>
                                </div>
                                <AdminView />
                            </div>
                        )}

                        {dashboard.teamLead && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Rocket className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Dự án</h2>
                                </div>
                                <TeamLeadView />
                            </div>
                        )}

                        {dashboard.member && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Công việc </h2>
                                </div>
                                <MemberView />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

// --- Sub-components for cleaner code ---

const StatusSummaryCard = ({ label, count, color, icon: Icon }) => {
    const colorStyles = {
        blue: {
            bg: 'bg-blue-600',
            light: 'bg-blue-50/50 text-blue-700 border-blue-100',
            icon: 'text-blue-600 shadow-blue-100'
        },
        amber: {
            bg: 'bg-amber-600',
            light: 'bg-amber-50/50 text-amber-700 border-amber-100',
            icon: 'text-amber-600 shadow-amber-100'
        },
        green: {
            bg: 'bg-emerald-600',
            light: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
            icon: 'text-emerald-600 shadow-emerald-100'
        },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            whileHover={{ y: -5, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
            className={`p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-center items-center text-center transition-all ${style.light}`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/80 backdrop-blur-sm shadow-sm ${style.icon}`}>
                {Icon && <Icon className="w-5 h-5" />}
            </div>
            <h4 className="text-3xl font-black tracking-tight leading-none mb-1">{count}</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">{label}</p>
        </motion.div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/20',
        purple: 'text-purple-600 bg-purple-50 border-purple-100 shadow-purple-100/20',
        green: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/20',
        red: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/20',
    };

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-gray-200/50"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 shadow-lg ${colors[color]}`}>
                <Icon className="w-7 h-7" />
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-2 px-1">{title}</p>
            <h4 className="text-3xl font-black text-gray-900 tracking-tight px-1 group-hover:text-blue-600 transition-colors truncate">{value}</h4>

            <div className={`absolute top-8 right-8 w-2 h-2 rounded-full opacity-30 ${colors[color].split(' ')[1]}`} />
        </motion.div>
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

