import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, UserCheck } from 'lucide-react';

// API Hooks
import { useGetMeQuery } from '../../api/auth';
import { useGetDashboardDataQuery } from '../../api/dashboard';
import { useGetTasksQuery } from '../../api/tasks';

// Components
import { MemberSelector } from '../../components/dashboard/MemberSelector';
import { MonthSelector } from '../../components/dashboard/MonthSelector';
import { ProjectSelector } from '../../components/dashboard/ProjectSelector';
import { AdminView } from '../../components/dashboard/AdminView';
import { TeamLeadView } from '../../components/dashboard/TeamLeadView';
import { BDView } from '../../components/dashboard/BDView';
import { MemberView } from '../../components/dashboard/MemberView';
import { getCurrentUserId } from '../../utils/authUser';

const PaymentOverviewPage = lazy(() =>
    import('../Finance/PaymentOverviewPage').then((module) => ({ default: module.PaymentOverviewPage }))
);

const DashboardRouteFallback = () => (
    <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
);

const SkeletonBlock = ({ className = "" }) => (
    <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
);

const DashboardSkeleton = ({ user }) => (
    <div className="relative min-h-screen pb-20">
        <div className="space-y-6 max-w-[1600px] mx-auto px-4 md:px-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <SkeletonBlock className="h-7 w-56" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                        Chào mừng trở lại, <span className="text-orange-600 font-bold">{user?.fullName || user?.username || "..."}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <SkeletonBlock className="h-10 w-44 rounded-2xl" />
                    <SkeletonBlock className="h-10 w-36 rounded-2xl" />
                    <SkeletonBlock className="h-10 w-40 rounded-2xl" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <SkeletonBlock className="mb-4 h-4 w-28" />
                            <SkeletonBlock className="mb-3 h-8 w-20" />
                            <SkeletonBlock className="h-3 w-36" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
                        <div className="mb-5 flex items-center justify-between">
                            <SkeletonBlock className="h-5 w-40" />
                            <SkeletonBlock className="h-8 w-28 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                                    <SkeletonBlock className="h-10 w-10 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <SkeletonBlock className="h-4 w-2/3" />
                                        <SkeletonBlock className="h-3 w-1/3" />
                                    </div>
                                    <SkeletonBlock className="h-7 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <SkeletonBlock className="mb-5 h-5 w-36" />
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <SkeletonBlock className="h-9 w-9 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <SkeletonBlock className="h-4 w-3/4" />
                                        <SkeletonBlock className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <SkeletonBlock className="mb-5 h-5 w-44" />
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 28 }).map((_, index) => (
                            <SkeletonBlock key={index} className="h-16 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const currentUserId = getCurrentUserId(user);
    const userRole = user?.role || user?.account?.role;
    const isAdminOrBod = userRole === 'ADMIN' || userRole === 'BOD';
    const isPM = userRole === 'PM';
    const isAdminSale = userRole === 'ADMIN_SALE';
    const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'personal'
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardDataQuery({
        userId: selectedMemberId,
        month: selectedDate.month,
        year: selectedDate.year,
        projectId: selectedProjectId,
        mode: isPM && !selectedMemberId ? (viewMode === 'personal' ? 'personal' : 'management') : undefined
    }, {
        skip: isAdminSale
    });
    const dashboard = dashboardData || {};
    const { data: awaitingReviewTasks, isLoading: isTasksLoading } = useGetTasksQuery(
        { status: 'AWAITING_REVIEW' },
        { skip: isAdminOrBod || isAdminSale }
    );

    if (isAdminSale) {
        return (
            <Suspense fallback={<DashboardRouteFallback />}>
                <PaymentOverviewPage />
            </Suspense>
        );
    }

    const dashboardScope = dashboard?.scope;
    const isExcludedSaleRole = userRole === 'BD' || userRole === 'ADMIN_SALE';
    const canSelectMember = !isExcludedSaleRole && (dashboardScope?.canSelectMembers ?? isAdminOrBod);
    const effectiveTeamMembers = dashboardScope?.availableMembers || [];
    const availableProjects = dashboardScope?.availableProjects || [];

    const handleSelectMember = (memberId) => {
        setSelectedMemberId(memberId);
        setSelectedProjectId(null);
    };

    const isViewingMember = !isExcludedSaleRole && !!selectedMemberId;
    const isTeamLead = dashboardScope?.type === 'MANAGEMENT';
    const isManagementOrAdmin = isAdminOrBod || userRole === 'PM';
    const isAccountViewer = !isExcludedSaleRole && (Boolean(dashboardScope?.isAccountViewer) || !isManagementOrAdmin);
    const isAccountViewingMember = isViewingMember && (
        Boolean(dashboardScope?.isAccountViewingMember) || isAccountViewer
    );

    const isLoading = isDashboardLoading || isTasksLoading;

    if (isLoading) {
        return <DashboardSkeleton user={user} />;
    }

    return (
        <div className="relative min-h-screen pb-20">
            {/* Background Decorative Elements */}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-6 max-w-[1600px] mx-auto px-4 md:px-0"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 mb-2">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 "
                        >
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                Bảng điều khiển
                            </h1>
                        </motion.div>
                        <p className="text-sm text-gray-500 font-medium">
                            Chào mừng trở lại, <span className="text-orange-600 font-bold">{user?.fullName || user?.username}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* PM Quick Mode Switcher */}
                        {isPM && !selectedMemberId && (
                            <button
                                type="button"
                                onClick={() => setViewMode(prev => prev === 'personal' ? 'overview' : 'personal')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm border ${
                                    viewMode === 'personal'
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-orange-200 hover:shadow-md'
                                        : 'bg-white hover:bg-orange-50 text-slate-700 border-gray-100 hover:border-orange-200'
                                }`}
                            >
                                {viewMode === 'personal' ? (
                                    <>
                                        <LayoutDashboard className="w-4 h-4 text-white" />
                                        <span>Xem tổng quan dự án</span>
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="w-4 h-4 text-orange-500" />
                                        <span>Công việc của tôi</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Project Selector (bộ lọc dự án) */}
                        <div className="h-full flex mt-0">
                            <ProjectSelector
                                projects={availableProjects}
                                selectedId={selectedProjectId}
                                onSelect={setSelectedProjectId}
                            />
                        </div>

                        {/* Month Selector (bộ lọc thời gian) */}
                        <MonthSelector
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                        />
                        {/* Member Selector (chỉ hiển thị khi có quyền canSelectMember) */}
                        {canSelectMember && (
                            <div className="h-full flex mt-0">
                                <MemberSelector
                                    members={effectiveTeamMembers}
                                    selectedId={selectedMemberId}
                                    onSelect={handleSelectMember}
                                    currentUserId={currentUserId}
                                    workloads={dashboard?.staffWorkloads || dashboard?.admin?.staffWorkloads}
                                    isPM={isPM}
                                    viewMode={viewMode}
                                    onSelectViewMode={setViewMode}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key="dashboard-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3 pb-2"
                    >
                        {isViewingMember ? (
                            <div className="">
                                <MemberView
                                    dashboard={dashboard}
                                    navigate={navigate}
                                    isViewingMember={isViewingMember}
                                    isAccountViewingMember={isAccountViewingMember}
                                    selectedMemberId={selectedMemberId}
                                    selectedProjectId={selectedProjectId}
                                    onSelectProject={setSelectedProjectId}
                                    availableProjects={availableProjects}
                                    teamMembers={effectiveTeamMembers}
                                    isTeamLead={isTeamLead}
                                    onSelectMember={handleSelectMember}
                                    currentUserId={currentUserId}
                                    awaitingReviewTasks={awaitingReviewTasks}
                                    user={user}
                                    selectedDate={selectedDate}
                                    viewMode={isPM ? viewMode : 'personal'}
                                />
                            </div>
                        ) : (
                            <>
                                {isAdminOrBod && (
                                    <AdminView
                                        dashboard={dashboard}
                                        navigate={navigate}
                                        onSelectMember={setSelectedMemberId}
                                    />
                                )}

                                {!isAdminOrBod && user?.role === 'BD' && (
                                    <BDView
                                        dashboard={dashboard}
                                        navigate={navigate}
                                    />
                                )}

                                {!isAdminOrBod && user?.role !== 'BD' && (
                                    <div className="">
                                        <MemberView
                                            dashboard={dashboard}
                                            navigate={navigate}
                                            isViewingMember={false}
                                            selectedMemberId={null}
                                            selectedProjectId={selectedProjectId}
                                            onSelectProject={setSelectedProjectId}
                                            availableProjects={availableProjects}
                                            teamMembers={effectiveTeamMembers}
                                            isTeamLead={isTeamLead}
                                            onSelectMember={handleSelectMember}
                                            currentUserId={currentUserId}
                                            awaitingReviewTasks={awaitingReviewTasks}
                                            user={user}
                                            selectedDate={selectedDate}
                                            viewMode={isPM ? viewMode : 'personal'}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
