import { useNavigate } from 'react-router-dom';
import { Users, User, ArrowRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';
import { cn } from '../../utils/cn';

export const TeamsTable = ({ teams = [] }) => {
    const navigate = useNavigate();
    const {
        data: paginatedTeams,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(teams, { initialSort: { key: 'name', direction: 'ascending' } });

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
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
                            {renderSortableHeader('Tên Đội', 'name')}
                            {renderSortableHeader('Trưởng Nhóm', 'teamLead.fullName')}
                            {renderSortableHeader('Thành Viên', 'members.length')}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedTeams.map((team) => (
                            <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-gray-900 uppercase tracking-tight">{team.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {team.teamLead ? (
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{team.teamLead.fullName || team.teamLead.username}</div>
                                                <div className="text-[10px] text-gray-500 font-medium">{team.teamLead.email}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Chưa có Lead</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="font-bold text-gray-900">{team.members?.length || 0}</span>
                                        <span className="ml-1 text-xs text-gray-500 font-medium">thành viên</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => navigate(`/teams/${team.id}`)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-sm"
                                    >
                                        Chi tiết
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!teams || teams.length === 0) && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">
                                    Chưa có đội dự án nào.
                                </td>
                            </tr>
                        )}
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
