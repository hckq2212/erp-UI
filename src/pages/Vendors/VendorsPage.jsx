import { useGetVendorsQuery } from '../../api/vendors';
import { formatCurrency } from '../../utils/format';
import { Store, Mail, Phone, MapPin, Plus, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useState, useMemo } from 'react';
import { CreateVendorModal } from './CreateVendorModal';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';
import { TableFilters } from '../../components/ui/TableFilters';
import { cn } from '../../utils/cn';
import { useGetMeQuery } from '../../api/auth';

export const VendorsPage = () => {
    const navigate = useNavigate();
    const { data: vendorsData = [], isLoading } = useGetVendorsQuery();
    const { data: me } = useGetMeQuery();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const vendors = useMemo(() => {
        const rawData = Array.isArray(vendorsData) ? vendorsData : (vendorsData?.data || []);
        return rawData.filter(vendor =>
            (vendor.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (vendor.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (vendor.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [vendorsData, searchTerm]);

    const {
        data: paginatedVendors,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(vendors, { initialSort: { key: 'name', direction: 'ascending' } });

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
            className={cn(
                "px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group",
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
            )}
            onClick={() => requestSort(sortKey)}
        >
            <div className={cn("flex items-center", align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    const handleReset = () => {
        setSearchTerm('');
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Quản Lý Vendor</h1>
                    <p className="text-gray-500 text-sm mt-1">Danh sách các đối tác cung cấp dịch vụ</p>
                </div>
                {['ADMIN', 'BOD'].includes(me?.role) && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm Vendor
                    </Button>
                )}
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue="ALL"
                onFilterChange={() => { }}
                filterOptions={[]}
                searchPlaceholder="Tìm tên vendor, email, SĐT..."
                onReset={handleReset}
            />

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách vendor...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        {renderSortableHeader('Tên Vendor', 'name')}
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Xem chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedVendors.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shadow-sm transition-transform group-hover:scale-105">
                                                        <Store className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{vendor.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                                                        <Mail className="h-3 w-3 text-blue-400" />
                                                        {vendor.email || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                        <Phone className="h-3 w-3 text-emerald-400" />
                                                        {vendor.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                    <MapPin className="h-3 w-3 text-red-300" />
                                                    <span className="truncate max-w-[200px]" title={vendor.address}>{vendor.address || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                                                    className="text-white bg-blue-600 rounded-xl px-4 py-1.5 font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {vendors.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-16 text-center text-gray-400 italic">
                                                Không tìm thấy vendor nào
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
                    </>
                )}
            </div>

            <CreateVendorModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
