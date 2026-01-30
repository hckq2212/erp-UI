import { useGetVendorsQuery } from '../../api/vendors';
import { formatCurrency } from '../../utils/format';
import { Store, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VendorsPage = () => {
    const { data: vendors = [], isLoading } = useGetVendorsQuery();
    const navigate = useNavigate();

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Quản Lý Vendor</h1>
                    <p className="text-gray-500 text-sm mt-1">Danh sách các đối tác cung cấp dịch vụ</p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách vendor...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên Vendor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Xem chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <Store className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                                                    <p className="text-xs text-gray-500">{vendor.code || `VND-${vendor.id}`}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Mail className="h-3 w-3" />
                                                    {vendor.email || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Phone className="h-3 w-3" />
                                                    {vendor.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate max-w-[200px]">{vendor.address || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <button
                                                onClick={() => navigate(`/vendors/${vendor.id}`)}
                                                className="text-white bg-blue-600 rounded-md px-2 py-1 hover:bg-blue-700 transition-colors"
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {vendors.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                            Không tìm thấy vendor nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
