import { useNavigate } from 'react-router-dom';
import { Calendar, User, Briefcase, ChevronRight, Clock, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/enums';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';

export const GlobalTaskTable = ({
    tasks = [],
    meta = { total: 0, page: 1, limit: 10, totalPages: 0 },
    onPageChange,
    onSortChange,
    currentSort
}) => {
    const navigate = useNavigate();
    const {
        data: paginatedTasks,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(tasks, {
        initialSort: {
            key: currentSort?.sortBy || 'code',
            direction: currentSort?.sortDir === 'ASC' ? 'ascending' : 'descending'
        },
        remote: true,
        totalItems: meta.total,
        itemsPerPage: meta.limit
    });

    // Override internal state changes with external ones
    const handlePageChange = (page) => {
        setCurrentPage(page);
        onPageChange?.(page);
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
            onSortChange?.('createdAt', 'DESC');
            requestSort(null);
            return;
        }
        onSortChange?.(key, direction === 'ascending' ? 'ASC' : 'DESC');
        requestSort(key);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
            className={cn(
                "px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100/50 transition-colors group",
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
            )}
            onClick={() => handleSort(sortKey)}
        >
            <div className={cn("flex items-center", align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[1600px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            {renderSortableHeader('Mã Công Việc', 'code')}
                            {renderSortableHeader('Tên Công Việc', 'name')}
                            {renderSortableHeader('Dự án', 'project.name')}
                            {renderSortableHeader('Phân công', 'assignee.fullName')}
                            {renderSortableHeader('Thời hạn', 'plannedEndDate')}
                            {renderSortableHeader('Trạng thái', 'status', 'center')}
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedTasks.length > 0 ? (
                            paginatedTasks.map((task) => (
                                <tr
                                    key={task.id}
                                    className="hover:bg-blue-50/30 transition-all group cursor-pointer"
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-md font-bold text-blue-600 font-medium ">{task.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 line-clamp-1">{task.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span className="text-sm font-medium line-clamp-1">{task.project?.name || '---'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                                                {(task.assignee?.fullName || task.assignee?.name)?.charAt(0) || <User className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="text-xs font-medium line-clamp-1">{task.assignee?.fullName || task.assignee?.name || 'Chưa phân công'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs text-nowrap">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>Deadline: {formatDate(task.plannedEndDate)}</span>
                                            </div>
                                            {task.status === 'PENDING' && task.plannedEndDate && new Date(task.plannedEndDate) < new Date() && (
                                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    QUÁ HẠN
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            TASK_STATUS_COLORS[task.status] || "bg-gray-100 text-gray-600"
                                        )}>
                                            {TASK_STATUS_LABELS[task.status] || task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="px-4 py-2 text-white bg-blue-600 rounded-xl transition-all font-bold">
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Clock className="w-12 h-12 text-gray-200" />
                                        <p className="text-gray-400 font-medium">Không tìm thấy công việc nào phù hợp</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={handlePageChange}
                totalItems={meta.total}
            />
        </div>
    );
};
