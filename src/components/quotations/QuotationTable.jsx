import { Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const QuotationTable = ({ quotations, onEdit, onDelete, onView }) => {
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'Draft': return 'bg-gray-100 text-gray-800';
            case 'Sent': return 'bg-blue-100 text-blue-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Báo Giá</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Lập</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hết Hạn</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Tiền (VND)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {quotations.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => onView(quote)}>{quote.code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.issueDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.expiryDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{quote.totalAmount}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", getStatusColor(quote.status))}>
                                    {quote.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                     <button onClick={() => onView(quote)} className="text-gray-400 hover:text-gray-600">
                                        <Eye className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onEdit(quote)} className="text-blue-400 hover:text-blue-600">
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onDelete(quote.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
