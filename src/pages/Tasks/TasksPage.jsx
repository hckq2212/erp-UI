import { useState } from 'react';
import { useGetTasksQuery } from '../../api/tasks';
import { GlobalTaskTable } from './GlobalTaskTable';
import { TaskFilters } from './TaskFilters';
import { TaskSchedule } from './TaskSchedule';
import { ClipboardList, Filter, LayoutGrid, Calendar as CalendarIcon, List, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TaskCreateModal } from './TaskCreateModal';

export const TasksPage = () => {
    const [viewType, setViewType] = useState('table'); // 'table' | 'schedule'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'ALL'
    });

    const { data: tasks = [], isLoading } = useGetTasksQuery(filters);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({ search: '', status: 'ALL' });
    };

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
                        <span className="font-bold">{tasks.length}</span>
                        <span className="text-sm font-medium">Tổng việc</span>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 px-6 py-2.5 rounded-xl border border-blue-700 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-bold">Tạo công việc</span>
                    </button>

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
                onReset={handleReset}
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách công việc...</p>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    {viewType === 'table' ? (
                        <GlobalTaskTable tasks={tasks} />
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
