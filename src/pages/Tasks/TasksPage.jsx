import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { selectCurrentUser } from '../../store/authSlice';
import { useGetTasksQuery } from '../../api/tasks';
import { useGetTeamsQuery } from '../../api/teams';
import { useGetUsersQuery } from '../../api/users';
import { useGetProjectsQuery } from '../../api/projects';
import { GlobalTaskTable } from './GlobalTaskTable';
import { TaskFilters } from './TaskFilters';
import { TaskSchedule } from './TaskSchedule';
import { ClipboardList, Calendar as CalendarIcon, List, Plus, Filter, Calendar, X, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TaskCreateModal } from './TaskCreateModal';
import { PROJECT_MANAGEMENT_ROLES, TASK_STATUS_LABELS } from '../../utils/enums';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';
import { formatDate } from '../../utils/format';

export const TasksPage = () => {
    const user = useSelector(selectCurrentUser);
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewType, setViewType] = useState('table'); // 'table' | 'schedule'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [filters, setFilters] = useState(() => ({
        search: searchParams.get('search') || '',
        status: searchParams.get('status') || 'ALL',
        assigneeId: searchParams.get('assigneeId') || '',
        dateType: searchParams.get('dateType') || 'plannedEndDate',
        deadline: searchParams.get('deadline') || '',
        deadlineFrom: searchParams.get('deadlineFrom') || '',
        deadlineTo: searchParams.get('deadlineTo') || '',
        projectId: searchParams.get('projectId') || '',
        page: Number(searchParams.get('page')) || 1,
        limit: Number(searchParams.get('limit')) || 10,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortDir: searchParams.get('sortDir') || 'DESC'
    }));

    // Listen to external URL param changes (e.g. navigation or browser back/forward)
    useEffect(() => {
        const newStatus = searchParams.get('status') || 'ALL';
        const newSearch = searchParams.get('search') || '';
        const newAssigneeId = searchParams.get('assigneeId') || '';
        const newDateType = searchParams.get('dateType') || 'plannedEndDate';
        const newDeadline = searchParams.get('deadline') || '';
        const newDeadlineFrom = searchParams.get('deadlineFrom') || '';
        const newDeadlineTo = searchParams.get('deadlineTo') || '';
        const newProjectId = searchParams.get('projectId') || '';
        const newPage = Number(searchParams.get('page')) || 1;
        const newLimit = Number(searchParams.get('limit')) || 10;
        const newSortBy = searchParams.get('sortBy') || 'createdAt';
        const newSortDir = searchParams.get('sortDir') || 'DESC';

        setFilters(prev => {
            if (
                prev.status === newStatus &&
                prev.search === newSearch &&
                prev.assigneeId === newAssigneeId &&
                prev.dateType === newDateType &&
                prev.deadline === newDeadline &&
                prev.deadlineFrom === newDeadlineFrom &&
                prev.deadlineTo === newDeadlineTo &&
                prev.projectId === newProjectId &&
                prev.page === newPage &&
                prev.limit === newLimit &&
                prev.sortBy === newSortBy &&
                prev.sortDir === newSortDir
            ) {
                return prev;
            }
            return {
                status: newStatus,
                search: newSearch,
                assigneeId: newAssigneeId,
                dateType: newDateType,
                deadline: newDeadline,
                deadlineFrom: newDeadlineFrom,
                deadlineTo: newDeadlineTo,
                projectId: newProjectId,
                page: newPage,
                limit: newLimit,
                sortBy: newSortBy,
                sortDir: newSortDir
            };
        });
    }, [searchParams]);

    // Keep URL query params in sync with active filters
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
        if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
        if (filters.dateType && filters.dateType !== 'plannedEndDate') params.set('dateType', filters.dateType);
        if (filters.deadline) params.set('deadline', filters.deadline);
        if (filters.deadlineFrom) params.set('deadlineFrom', filters.deadlineFrom);
        if (filters.deadlineTo) params.set('deadlineTo', filters.deadlineTo);
        if (filters.projectId) params.set('projectId', filters.projectId);
        if (filters.page > 1) params.set('page', String(filters.page));
        if (filters.limit !== 10) params.set('limit', String(filters.limit));
        if (filters.sortBy !== 'createdAt') params.set('sortBy', filters.sortBy);
        if (filters.sortDir !== 'DESC') params.set('sortDir', filters.sortDir);

        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    const { data, isLoading } = useGetTasksQuery(filters);
    const { data: teamsResult = [] } = useGetTeamsQuery();
    const tasks = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };
    const teams = Array.isArray(teamsResult) ? teamsResult : (teamsResult?.data || []);
    const currentUserId = getCurrentUserId(user);
    const isProjectManagementUser = PROJECT_MANAGEMENT_ROLES.includes(user?.role);
    const isTeamLead = teams.some(team =>
        isSameUser(team.teamLeadId, currentUserId) || isSameUser(team.teamLead?.id, currentUserId)
    );
    const canFilterByAssignee = isProjectManagementUser || isTeamLead;
    const canCreateInternalTask = isProjectManagementUser || isTeamLead;
    const { data: usersResult = [], isFetching: isLoadingUsers } = useGetUsersQuery(undefined, {
        skip: !canFilterByAssignee
    });
    const users = Array.isArray(usersResult) ? usersResult : (usersResult?.data || []);
    const { data: projectsResult = [] } = useGetProjectsQuery();
    const projects = Array.isArray(projectsResult) ? projectsResult : (projectsResult?.data || []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleMultipleFilterChange = (updates) => {
        setFilters(prev => ({ ...prev, ...updates, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (sortBy, sortDir) => {
        setFilters(prev => ({ ...prev, sortBy, sortDir, page: 1 }));
    };

    const handleReset = () => {
        setFilters({
            search: '',
            status: 'ALL',
            assigneeId: '',
            dateType: 'plannedEndDate',
            deadline: '',
            deadlineFrom: '',
            deadlineTo: '',
            projectId: '',
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortDir: 'DESC'
        });
    };

    const hasActiveFilters = Boolean(
        filters.search ||
        (filters.status && filters.status !== 'ALL') ||
        filters.assigneeId ||
        (filters.dateType && filters.dateType !== 'plannedEndDate') ||
        filters.deadline ||
        filters.deadlineFrom ||
        filters.deadlineTo ||
        filters.projectId
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản Lý Công Việc</h1>
                    <p className="text-gray-500 text-sm mt-1">Theo dõi và quản lý tất cả nhiệm vụ trong toàn bộ dự án</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-700">
                        <ClipboardList className="w-5 h-5" />
                        <span className="font-bold">{meta.total}</span>
                        <span className="text-sm font-medium">Tổng việc</span>
                    </div>

                    {canCreateInternalTask && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 px-6 py-2.5 rounded-xl border border-blue-700 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-bold">Tạo công việc khác</span>
                        </button>
                    )}

                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm ml-auto md:ml-0">
                        <button
                            onClick={() => setViewType('table')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                viewType === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            )}
                        >
                            <List className="w-4 h-4" />
                            Danh sách
                        </button>
                        <button
                            onClick={() => setViewType('schedule')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                viewType === 'schedule' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            )}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Lịch trình
                        </button>
                    </div>
                </div>
            </div>

            <TaskFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onMultipleFilterChange={handleMultipleFilterChange}
                onReset={handleReset}
                canFilterByAssignee={canFilterByAssignee}
                users={users}
                isLoadingUsers={isLoadingUsers}
            />

            {/* Active Context Banner */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200/80 px-4 py-3 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
                        <span className="inline-flex items-center gap-1.5 font-bold text-orange-700">
                            <Filter className="w-4 h-4 text-orange-500" />
                            Đang lọc:
                        </span>

                        {/* Deadline / Time Range tag */}
                        {(filters.deadline || filters.deadlineFrom || filters.deadlineTo) && (
                            <span className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs">
                                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                {(() => {
                                    const prefix = filters.dateType === 'actualEndDate'
                                        ? 'Hoàn thành'
                                        : filters.dateType === 'plannedRange'
                                        ? 'Kế hoạch chạy'
                                        : filters.dateType === 'actualStartDate'
                                        ? 'Bắt đầu'
                                        : 'Hạn chót';

                                    if (filters.deadline === 'today') return `${prefix}: Hôm nay`;
                                    if (filters.deadlineFrom && filters.deadlineTo) {
                                        if (filters.deadlineFrom === filters.deadlineTo) {
                                            return `${prefix}: ${formatDate(filters.deadlineFrom)}`;
                                        }
                                        return `${prefix}: ${formatDate(filters.deadlineFrom)} → ${formatDate(filters.deadlineTo)}`;
                                    }
                                    if (filters.deadlineFrom) return `${prefix} từ: ${formatDate(filters.deadlineFrom)}`;
                                    if (filters.deadlineTo) return `${prefix} đến: ${formatDate(filters.deadlineTo)}`;
                                    return `${prefix}: ${formatDate(filters.deadline)}`;
                                })()}
                                <button
                                    onClick={() => handleMultipleFilterChange({ deadline: '', deadlineFrom: '', deadlineTo: '', dateType: 'plannedEndDate' })}
                                    className="hover:text-red-500 ml-1"
                                    title="Bỏ lọc thời gian"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {/* Status tag */}
                        {filters.status && filters.status !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs">
                                Trạng thái: {TASK_STATUS_LABELS[filters.status] || filters.status}
                                <button
                                    onClick={() => handleFilterChange('status', 'ALL')}
                                    className="hover:text-red-500 ml-1"
                                    title="Bỏ lọc trạng thái"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {/* Assignee tag */}
                        {filters.assigneeId && (
                            <span className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs">
                                Nhân sự: {users.find(u => u.id === filters.assigneeId)?.fullName || users.find(u => u.id === filters.assigneeId)?.account?.username || 'Đã chọn'}
                                <button
                                    onClick={() => handleFilterChange('assigneeId', '')}
                                    className="hover:text-red-500 ml-1"
                                    title="Bỏ lọc nhân sự"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {/* Project tag */}
                        {filters.projectId && (
                            <span className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs">
                                Dự án: {projects.find(p => p.id === filters.projectId)?.name || 'Đã chọn'}
                                <button
                                    onClick={() => handleFilterChange('projectId', '')}
                                    className="hover:text-red-500 ml-1"
                                    title="Bỏ lọc dự án"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {/* Search tag */}
                        {filters.search && (
                            <span className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs">
                                Từ khóa: "{filters.search}"
                                <button
                                    onClick={() => handleFilterChange('search', '')}
                                    className="hover:text-red-500 ml-1"
                                    title="Bỏ lọc từ khóa"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        <span className="text-xs text-gray-500 font-medium ml-1">
                            (Tìm thấy <strong className="text-gray-900 font-bold">{meta.total}</strong> công việc)
                        </span>
                    </div>

                    <button
                        onClick={handleReset}
                        className="text-xs font-bold text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1 ml-auto"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Xóa tất cả lọc
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách công việc...</p>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    {viewType === 'table' ? (
                        <GlobalTaskTable
                            tasks={tasks}
                            meta={meta}
                            onPageChange={handlePageChange}
                            onSortChange={handleSortChange}
                            currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDir }}
                        />
                    ) : (
                        <TaskSchedule tasks={tasks} />
                    )}
                </div>
            )}

            <TaskCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
