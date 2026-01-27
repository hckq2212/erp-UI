import { Edit, Eye, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ContractTable = ({ contracts, onEdit, onDelete, onView }) => {
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Expired': return 'bg-gray-100 text-gray-800';
            case 'Terminated': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Hợp Đồng</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Báo Giá</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Ký</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiệu Lực</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá Trị (VND)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => onView(contract)}>{contract.code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.quotationCode}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.signedDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.startDate} - {contract.endDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{contract.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", getStatusColor(contract.status))}>
                                    {contract.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                     <button onClick={() => onView(contract)} className="text-gray-400 hover:text-gray-600">
                                        <Eye className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onEdit(contract)} className="text-blue-400 hover:text-blue-600">
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => onDelete(contract.id)} className="text-red-400 hover:text-red-600">
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
