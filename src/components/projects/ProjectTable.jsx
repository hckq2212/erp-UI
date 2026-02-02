import { Eye, Edit, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../utils/enums';
import { useNavigate } from 'react-router-dom';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';

const getStatusColor = (status) => PROJECT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
const getStatusLabel = (status) => PROJECT_STATUS_LABELS[status] || status;

export const ProjectTable = ({ projects = [], onView, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const {
        data: paginatedProjects,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(projects, { initialSort: { key: 'name', direction: 'ascending' } });

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
            scope="col"
            className={cn(
                "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group",
                align === 'right' ? 'text-right' : 'text-left'
            )}
            onClick={() => requestSort(sortKey)}
        >
            <div className={cn("flex items-center", align === 'right' ? 'justify-end' : 'justify-start')}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            {renderSortableHeader('Mã HĐ', 'contract.contractCode')}
                            {renderSortableHeader('Tên Dự Án', 'name')}
                            {renderSortableHeader('Đội Ngũ', 'team.name')}
                            {renderSortableHeader('Trạng Thái', 'status')}
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedProjects.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => onView(project)}>
                                    {project.contract?.contractCode || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{project.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.team?.name || 'Chưa phân công'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={cn("px-2 inline-flex text-[10px] font-bold uppercase rounded-full border leading-5", getStatusColor(project.status))}>
                                        {getStatusLabel(project.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => navigate(`/projects/${project.id}`)} className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-xl font-bold transition-all shadow-sm">
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
            />
        </div>
    );
};
