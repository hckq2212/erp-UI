import { Edit, Eye, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { formatVND } from '../../utils/format';

export const ContractTable = ({
    contracts = [],
    meta = { total: 0, page: 1, limit: 10, totalPages: 0 },
    onPageChange,
    onSortChange,
    currentSort,
    onEdit,
    onDelete,
    onView
}) => {
    const navigate = useNavigate();
    const {
        data: paginatedContracts,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(contracts, {
        initialSort: {
            key: currentSort?.sortBy || 'contractCode',
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


    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-primary-action" />
            : <ArrowDown className="w-3 h-3 ml-1 text-primary-action" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
            scope="col"
            className={cn(
                "px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group",
                align === 'right' ? 'text-right' : 'text-left'
            )}
            onClick={() => handleSort(sortKey)}
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
                            {renderSortableHeader('Mã Hợp Đồng', 'contractCode')}
                            {renderSortableHeader('Khách Hàng', 'customer.name')}
                            {renderSortableHeader('Giá Bán (VND)', 'sellingPrice')}
                            {renderSortableHeader('Trạng Thái', 'status')}
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Xem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedContracts.map((contract) => (
                            <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.contractCode ?? contract.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.customer?.name ?? contract.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatVND(contract.sellingPrice ?? contract.selling_price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge domain="contract" status={contract.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => navigate(`/contracts/${contract.id}`)}
                                    >
                                        Xem chi tiết
                                    </Button>
                                </td>
                            </tr>
                        ))}
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
