import { Edit, Eye, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

export const ContractTable = ({ contracts, onEdit, onDelete, onView }) => {
    
    const navigate = useNavigate();

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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Hợp Đồng</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá Bán (VND)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Xem</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.contractCode ?? contract.code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.customer?.name ?? contract.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{Number(contract.sellingPrice || contract.selling_price || contract.sellingPrice).toLocaleString('vi-VN')} VNĐ</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", getStatusColor(contract.status))}>
                                    {contract.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => navigate(`/contracts/${contract.id}`)} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Xem chi tiết
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
