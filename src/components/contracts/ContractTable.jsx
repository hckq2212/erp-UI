import { Edit, Eye, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';
import { CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS } from '../../utils/enums';

export const ContractTable = ({ contracts = [], onEdit, onDelete, onView }) => {
    const navigate = useNavigate();
    const {
        data: paginatedContracts,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(contracts, { initialSort: { key: 'contractCode', direction: 'ascending' } });


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
                "px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group",
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{Number(contract.sellingPrice || contract.selling_price || contract.sellingPrice).toLocaleString('vi-VN')} VNĐ</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", CONTRACT_STATUS_COLORS[contract.status])}>
                                        {CONTRACT_STATUS_LABELS[contract.status]}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => navigate(`/contracts/${contract.id}`)} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold px-4">
                                        Xem chi tiết
                                    </button>
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
