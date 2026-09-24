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
    currentSort,
    compact = false,
    className = ''
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
        <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden", className)}>
            <div className="overflow-x-auto">
                <table className={cn("w-full text-sm text-left border-collapse", compact ? "min-w-[1300px]" : "min-w-[1600px]")}>
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            {renderSortableHeader('Mã Công Việc', 'code', 'left', 'min-w-[150px]')}
                            {renderSortableHeader('Tên mặc định', 'name', 'left', 'min-w-[180px]')}
                            {renderSortableHeader('Tên hiển thị', 'nickname', 'left', 'min-w-[180px]')}
                            {renderSortableHeader('Dự án', 'project.name', 'left', 'min-w-[160px]')}
                            {!compact && renderSortableHeader('Phân công', 'assignee.fullName', 'left', 'min-w-[170px]')}
                            {renderSortableHeader('Thời hạn', 'plannedEndDate', 'left', 'min-w-[210px]')}
                            {compact && renderSortableHeader('Ngày hoàn thành', 'actualEndDate', 'left', 'min-w-[200px]')}
                            {renderSortableHeader('Trạng thái', 'status', 'center', 'min-w-[170px]')}
                            {!compact && <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right whitespace-nowrap min-w-[130px]">Hành động</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedTasks.length > 0 ? (
                            paginatedTasks.map((task) => (
                                <tr
                                    key={task.id}
                                    className={cn(
                                        "transition-all group cursor-pointer",
                                        Number(task.spentAmount || 0) > Number(task.cost || 0) ? "bg-red-50/40 hover:bg-red-50 border-l-4 border-l-red-400" :
                                        task.isExtra ? "bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-400" : "hover:bg-blue-50/30"
                                    )}
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col whitespace-nowrap">
                                            <span className="text-md font-bold text-blue-600 font-medium whitespace-nowrap">{task.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium whitespace-nowrap">{task.name || '---'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <InlineTaskNickname
                                            task={task}
                                            projectId={task.project?.id}
                                            canEdit={PROJECT_MANAGEMENT_ROLES.includes(user?.role) || isSameUser(currentUserId, task.project?.team?.teamLead?.id)}
                                            className="whitespace-nowrap"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-600 whitespace-nowrap">
                                            <span className="text-sm font-medium whitespace-nowrap">{task.project?.name || '---'}</span>
                                        </div>
                                    </td>
                                    {!compact && <td className="px-6 py-4 whitespace-nowrap min-w-[170px]">
                                        <div className="flex items-center gap-2 text-gray-600 whitespace-nowrap">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200 shrink-0">
                                                {(task.assignee?.fullName || task.assignee?.name)?.charAt(0) || <User className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="text-xs font-medium whitespace-nowrap">{task.assignee?.fullName || task.assignee?.name || 'Chưa phân công'}</span>
                                        </div>
                                    </td>}
                                    <td className="px-6 py-4 whitespace-nowrap min-w-[210px]">
                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs whitespace-nowrap">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="whitespace-nowrap">{formatDateTime(task.plannedEndDate) || '---'}</span>
                                            </div>
                                            {task.status === 'PENDING' && task.plannedEndDate && new Date(task.plannedEndDate) < new Date() && (
                                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 whitespace-nowrap bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                                    QUÁ HẠN
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {compact && <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{formatDateTime(task.actualEndDate) || '---'}</span>
                                        </div>
                                    </td>}
                                    <td className="px-6 py-4 text-center whitespace-nowrap min-w-[170px]">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap inline-flex items-center justify-center shrink-0 shadow-2xs",
                                            TASK_STATUS_COLORS[task.status] || "bg-gray-100 text-gray-600"
                                        )}>
                                            {TASK_STATUS_LABELS[task.status] || task.status}
                                        </span>
                                    </td>
                                    {!compact && <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all font-bold text-xs whitespace-nowrap inline-flex items-center justify-center shrink-0 shadow-xs">
                                            Xem chi tiết
                                        </button>
                                    </td>}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={compact ? 7 : 8} className="px-6 py-20 text-center">
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
