import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
import { ReviewQueueView } from '../../components/dashboard/ReviewQueueView';
import { getCurrentUserId } from '../../utils/authUser';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const currentUserId = getCurrentUserId(user);
    const userRole = user?.role || user?.account?.role;
    const isAdminOrBod = userRole === 'ADMIN' || userRole === 'BOD';
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
        projectId: selectedProjectId
    });
    const dashboard = dashboardData || {};
    const { data: awaitingReviewTasks, isLoading: isTasksLoading } = useGetTasksQuery(
        { status: 'AWAITING_REVIEW' },
        { skip: isAdminOrBod }
    );

    const dashboardScope = dashboard?.scope;
    const canSelectMember = dashboardScope?.canSelectMembers ?? isAdminOrBod;
    const effectiveTeamMembers = dashboardScope?.availableMembers || [];
    const availableProjects = dashboardScope?.availableProjects || [];

    const handleSelectMember = (memberId) => {
        setSelectedMemberId(memberId);
        setSelectedProjectId(null);
    };

    const isViewingMember = !!selectedMemberId;
    const isTeamLead = dashboardScope?.type === 'MANAGEMENT';

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
                        {/* Member Selector (chỉ hiển thị cho PM, ADMIN, BOD) */}
                        {canSelectMember && (
                            <div className="h-full flex mt-0">
                                <MemberSelector
                                    members={effectiveTeamMembers}
                                    selectedId={selectedMemberId}
                                    onSelect={handleSelectMember}
                                    currentUserId={currentUserId}
                                    workloads={dashboard?.staffWorkloads || dashboard?.admin?.staffWorkloads}
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
                        {!isViewingMember && !isAdminOrBod && !isTeamLead && (
                            <ReviewQueueView
                                awaitingReviewTasks={awaitingReviewTasks}
                                user={user}
                                navigate={navigate}
                            />
                        )}

                        {!isViewingMember && isAdminOrBod && (
                            <AdminView
                                dashboard={dashboard}
                                navigate={navigate}
                                onSelectMember={setSelectedMemberId}
                            />
                        )}

                        {!isViewingMember && user?.role === 'BD' && (
                            <BDView
                                dashboard={dashboard}
                                navigate={navigate}
                            />
                        )}

                        {user?.role !== 'BD' && (!isAdminOrBod || isViewingMember) && (
                            <div className="">
                                <MemberView
                                    dashboard={dashboard}
                                    navigate={navigate}
                                    isViewingMember={isViewingMember}
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
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
