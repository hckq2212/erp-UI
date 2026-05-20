import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// API Hooks
import { useGetMeQuery } from '../../api/auth';
import { useGetDashboardDataQuery } from '../../api/dashboard';
import { useGetTasksQuery } from '../../api/tasks';
import { useGetTeamsQuery, useGetTeamMembersQuery } from '../../api/teams';

// Components
import { MemberSelector } from '../../components/dashboard/MemberSelector';
import { MonthSelector } from '../../components/dashboard/MonthSelector';
import { AdminView } from '../../components/dashboard/AdminView';
import { TeamLeadView } from '../../components/dashboard/TeamLeadView';
import { BDView } from '../../components/dashboard/BDView';
import { MemberView } from '../../components/dashboard/MemberView';
import { ReviewQueueView } from '../../components/dashboard/ReviewQueueView';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboardDataQuery({
        userId: selectedMemberId,
        month: selectedDate.month,
        year: selectedDate.year
    });
    const { data: awaitingReviewTasks, isLoading: isTasksLoading } = useGetTasksQuery({ status: 'AWAITING_REVIEW' });

    // Identify if the user is a lead of any team
    const { data: teams } = useGetTeamsQuery();
    const myTeam = teams?.find(t => t.teamLeadId === user?.id || t.teamLead?.id === user?.id);
    const { data: teamMembers = [] } = useGetTeamMembersQuery(myTeam?.id, { skip: !myTeam?.id });

    const isViewingMember = !!selectedMemberId;
    const isTeamLead = !!myTeam;

    const isLoading = isDashboardLoading || isTasksLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!dashboard) return null;

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

                    <div className="flex items-center gap-3">
                        <MonthSelector
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                        />
                        {/* Member Selector (1/4 cột cuối) */}
                        <div className=" h-full flex mt-0 ">
                            <MemberSelector
                                members={teamMembers}
                                selectedId={selectedMemberId}
                                onSelect={setSelectedMemberId}
                                currentUserId={user?.id}
                            />
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key="dashboard-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6 pb-12"
                    >
                        {!isViewingMember && (
                            <ReviewQueueView
                                awaitingReviewTasks={awaitingReviewTasks}
                                user={user}
                                navigate={navigate}
                            />
                        )}

                        {/* {dashboard.teamLead && !isViewingMember && (
                            <div className="space-y-4">
                                <TeamLeadView
                                    dashboard={dashboard}
                                    navigate={navigate}
                                    teamMembers={teamMembers}
                                    selectedMemberId={selectedMemberId}
                                    onSelectMember={setSelectedMemberId}
                                    currentUserId={user?.id}
                                />
                            </div>
                        )} */}

                        {(dashboard.member || isViewingMember) && user?.role !== 'BD' && user?.role !== 'SALE' && (
                            <div className="">
                                <MemberView
                                    dashboard={dashboard}
                                    navigate={navigate}
                                    isViewingMember={isViewingMember}
                                    selectedMemberId={selectedMemberId}
                                    teamMembers={teamMembers}
                                    isTeamLead={isTeamLead}
                                    onSelectMember={setSelectedMemberId}
                                    currentUserId={user?.id}
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

