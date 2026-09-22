import { useNavigate } from 'react-router-dom';
import { Calendar, User, Briefcase, ChevronRight, Clock, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PROJECT_MANAGEMENT_ROLES, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/enums';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/format';
import { useGetMeQuery } from '../../api/auth';
import { InlineTaskNickname } from '../../components/tasks/InlineTaskNickname';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';

export const GlobalTaskTable = ({
    tasks = [],
    meta = { total: 0, page: 1, limit: 10, totalPages: 0 },
    onPageChange,
    onSortChange,
    currentSort
}) => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
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
    const currentUserId = getCurrentUserId(user);

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


    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left', extraClass = '') => (
        <th
            className={cn(
                "px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100/50 transition-colors group whitespace-nowrap",
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
                extraClass
            )}
            onClick={() => handleSort(sortKey)}
        >
            <div className={cn("flex items-center whitespace-nowrap", align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}>
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
                            {renderSortableHeader('Mã Công Việc', 'code', 'left', 'min-w-[150px]')}
                            {renderSortableHeader('Tên mặc định', 'name', 'left', 'min-w-[180px]')}
                            {renderSortableHeader('Tên hiển thị', 'nickname', 'left', 'min-w-[180px]')}
                            {renderSortableHeader('Dự án', 'project.name', 'left', 'min-w-[160px]')}
                            {renderSortableHeader('Phân công', 'assignee.fullName', 'left', 'min-w-[170px]')}
                            {renderSortableHeader('Thời hạn', 'plannedEndDate', 'left', 'min-w-[210px]')}
                            {renderSortableHeader('Trạng thái', 'status', 'center', 'min-w-[170px]')}
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right whitespace-nowrap min-w-[130px]">Hành động</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-md font-bold text-blue-600 font-medium">{task.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium line-clamp-1">{task.name || '---'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <InlineTaskNickname
                                            task={task}
                                            projectId={task.project?.id}
                                            canEdit={PROJECT_MANAGEMENT_ROLES.includes(user?.role) || isSameUser(currentUserId, task.project?.team?.teamLead?.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span className="text-sm font-medium line-clamp-1">{task.project?.name || '---'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap min-w-[170px]">
                                        <div className="flex items-center gap-2 text-gray-600 whitespace-nowrap">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200 shrink-0">
                                                {(task.assignee?.fullName || task.assignee?.name)?.charAt(0) || <User className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="text-xs font-medium whitespace-nowrap">{task.assignee?.fullName || task.assignee?.name || 'Chưa phân công'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap min-w-[210px]">
                                        <div className="flex flex-col gap-1 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs whitespace-nowrap">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="whitespace-nowrap">{formatDateTime(task.plannedEndDate) || '---'}</span>
                                            </div>
                                            {task.status === 'PENDING' && task.plannedEndDate && new Date(task.plannedEndDate) < new Date() && (
                                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 whitespace-nowrap">
                                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                                    QUÁ HẠN
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap min-w-[170px]">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap inline-flex items-center justify-center shrink-0 shadow-2xs",
                                            TASK_STATUS_COLORS[task.status] || "bg-gray-100 text-gray-600"
                                        )}>
                                            {TASK_STATUS_LABELS[task.status] || task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all font-bold text-xs whitespace-nowrap inline-flex items-center justify-center shrink-0 shadow-xs">
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
