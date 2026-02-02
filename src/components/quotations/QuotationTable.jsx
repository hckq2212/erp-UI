import { Edit, Eye, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';

export const QuotationTable = ({ quotations = [], onEdit, onDelete, onView }) => {
    const {
        data: paginatedQuotations,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(quotations, { initialSort: { key: 'code', direction: 'ascending' } });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'bg-gray-100 text-gray-800';
            case 'Sent': return 'bg-blue-100 text-blue-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

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
                            {renderSortableHeader('Mã Báo Giá', 'code')}
                            {renderSortableHeader('Khách Hàng', 'customerName')}
                            {renderSortableHeader('Ngày Lập', 'issueDate')}
                            {renderSortableHeader('Hết Hạn', 'expiryDate')}
                            {renderSortableHeader('Tổng Tiền (VND)', 'totalAmount')}
                            {renderSortableHeader('Trạng Thái', 'status')}
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedQuotations.map((quote) => (
                            <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 cursor-pointer" onClick={() => onView(quote)}>{quote.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{quote.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.issueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.expiryDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">{quote.totalAmount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={cn("px-2 inline-flex text-[10px] font-bold uppercase rounded-full border leading-5", getStatusColor(quote.status))}>
                                        {quote.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => onView(quote)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                                            <Eye className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onEdit(quote)} className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors">
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onDelete(quote.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="h-5 w-5" />
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
