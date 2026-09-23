import React, { useState } from 'react';
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

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const currentUserId = getCurrentUserId(user);
    const userRole = user?.role || user?.account?.role;
    const isAdminOrBod = userRole === 'ADMIN' || userRole === 'BOD';
    const isPM = userRole === 'PM';
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
    });
    const dashboard = dashboardData || {};
    const { data: awaitingReviewTasks, isLoading: isTasksLoading } = useGetTasksQuery(
        { status: 'AWAITING_REVIEW' },
        { skip: isAdminOrBod }
    );

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
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
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
