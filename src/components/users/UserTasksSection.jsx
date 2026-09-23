import { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useGetTasksQuery } from '../../api/tasks';
import { TaskFilters } from '../../pages/Tasks/TaskFilters';
import { GlobalTaskTable } from '../../pages/Tasks/GlobalTaskTable';

export const UserTasksSection = ({ userId, userName }) => {
    const today = new Date();
    const defaultDeadlineFrom = format(startOfMonth(today), 'yyyy-MM-dd');
    const defaultDeadlineTo = format(endOfMonth(today), 'yyyy-MM-dd');

    const [taskFilters, setTaskFilters] = useState(() => ({
        search: '',
        status: 'ACCEPTED',
        assigneeId: userId,
        dateType: 'actualEndDate',
        deadline: '',
        deadlineFrom: defaultDeadlineFrom,
        deadlineTo: defaultDeadlineTo,
        projectId: '',
        page: 1,
        limit: 10,
        sortBy: 'actualEndDate',
        sortDir: 'DESC'
    }));

    useEffect(() => {
        if (userId) {
            setTaskFilters(prev => ({ ...prev, assigneeId: userId, page: 1 }));
        }
    }, [userId]);

    const { data: tasksData, isLoading: isLoadingTasks } = useGetTasksQuery(taskFilters, {
        skip: !userId
    });
    const tasks = tasksData?.data || [];
    const meta = tasksData?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };

    const handleFilterChange = (key, value) => {
        setTaskFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleMultipleFilterChange = (updates) => {
        setTaskFilters(prev => ({ ...prev, ...updates, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setTaskFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (sortBy, sortDir) => {
        setTaskFilters(prev => ({ ...prev, sortBy, sortDir, page: 1 }));
    };

    const handleClearAllFilters = () => {
        setTaskFilters({
            search: '',
            status: 'ALL',
            assigneeId: userId,
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

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-black text-gray-900 whitespace-nowrap">Công việc được giao</h3>
                        <p className="text-xs text-gray-500 whitespace-nowrap truncate">
                            Danh sách công việc{userName ? ` của ${userName}` : ''}
                        </p>
                    </div>
                </div>

                <span className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 shrink-0 whitespace-nowrap">
                    Tổng: <strong className="text-blue-600 font-black">{meta.total}</strong> công việc
                </span>
            </div>

            {/* Filter toolbar inside the unified block */}
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/30 space-y-3">
                <TaskFilters
                    filters={taskFilters}
                    onFilterChange={handleFilterChange}
                    onMultipleFilterChange={handleMultipleFilterChange}
                    onReset={handleClearAllFilters}
                    canFilterByAssignee={false}
                    showQuickPresets={false}
                    className="p-0 border-none shadow-none rounded-none bg-transparent mb-0 space-y-3"
                />
            </div>

            {/* Table View directly inside unified card */}
            {isLoadingTasks ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 text-xs font-medium animate-pulse whitespace-nowrap">Đang tải danh sách công việc...</p>
                </div>
            ) : (
                <GlobalTaskTable
                    tasks={tasks}
                    meta={meta}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                    currentSort={{ sortBy: taskFilters.sortBy, sortDir: taskFilters.sortDir }}
                    compact
                    className="rounded-none border-none shadow-none"
                />
            )}
        </div>
    );
};
