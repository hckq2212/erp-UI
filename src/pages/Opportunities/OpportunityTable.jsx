import { useNavigate } from 'react-router-dom';
import { Edit, Eye, Phone, Mail, User, DollarSign, Briefcase, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { OPPORTUNITY_STATUS_LABELS, OPPORTUNITY_STATUS_COLORS } from '../../utils/enums';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';

export const OpportunityTable = ({
    opportunities = [],
    meta = { total: 0, page: 1, limit: 10, totalPages: 0 },
    onPageChange,
    onSortChange,
    currentSort,
    onEdit
}) => {
    const navigate = useNavigate();
    const {
        data: paginatedOpportunities,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(opportunities, {
        initialSort: {
            key: currentSort?.sortBy || 'name',
            direction: currentSort?.sortDir === 'ASC' ? 'ascending' : 'descending'
        },
        remote: true,
        totalItems: meta.total,
        itemsPerPage: meta.limit
    });

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

    const formatCurrency = (value) => {
        if (!value) return '0 VNĐ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
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
            <div className="overflow-x-auto min-w-[1000px]">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            {renderSortableHeader('Khách Hàng', 'customer.name')}
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Thông tin liên hệ</th>
                            {renderSortableHeader('Doanh thu dự kiến', 'expectedRevenue')}
                            {renderSortableHeader('Trạng thái', 'status', 'center')}
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {paginatedOpportunities.length > 0 ? (
                            paginatedOpportunities.map((opp) => (
                                <tr key={opp.id} className="hover:bg-blue-50/30 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                {opp.customer?.name?.charAt(0) || opp.leadName?.charAt(0) || <User className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {opp.customer?.name || opp.leadName || '---'}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium">Tên cơ hội: {opp.opportunityCode}-{opp.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center text-gray-600 gap-2">
                                                <Phone className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="font-medium">{opp.customer?.phone || opp.leadPhone || '---'}</span>
                                            </div>
                                            <div className="flex items-center text-gray-400 gap-2">
                                                <Mail className="w-3.5 h-3.5 text-gray-300" />
                                                <span className="truncate max-w-[150px]">{opp.customer?.email || opp.leadEmail || '---'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                            <DollarSign className="w-4 h-4" />
                                            {formatCurrency(opp.expectedRevenue)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "px-3 py-1 inline-flex text-[10px] font-bold uppercase rounded-lg tracking-wider border",
                                            OPPORTUNITY_STATUS_COLORS[opp.status] || "bg-gray-100 text-gray-600"
                                        )}>
                                            {OPPORTUNITY_STATUS_LABELS[opp.status] || opp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => navigate(`/opportunities/${opp.id}`)}
                                                className="px-4 py-2 text-white bg-blue-600 rounded-xl transition-all font-bold"
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-gray-50 rounded-full">
                                            <Briefcase className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 font-medium italic">Chưa có cơ hội nào trong danh sách</p>
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
