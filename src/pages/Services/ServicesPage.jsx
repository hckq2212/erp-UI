import { useNavigate } from 'react-router-dom';
import { useGetServicesQuery } from '../../api/services';
import { formatCurrency } from '../../utils/format';
import { Plus, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState, useMemo } from 'react';
import { CreateServiceModal } from './CreateServiceModal';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';
import { TableFilters } from '../../components/ui/TableFilters';
import { cn as cnUtility } from '../../utils/cn';

export const ServicesPage = () => {
    const navigate = useNavigate();
    const { data: servicesData = [], isLoading } = useGetServicesQuery();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const services = useMemo(() => {
        const rawData = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
        return rawData.filter(service =>
            (service.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [servicesData, searchTerm]);

    const {
        data: paginatedServices,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(services, { initialSort: { key: 'name', direction: 'ascending' } });

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
            className={cnUtility(
                "px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors group",
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
            )}
            onClick={() => requestSort(sortKey)}
        >
            <div className={cnUtility("flex items-center", align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>Quản Lý Dịch Vụ</h1>
                    <p className="text-gray-500 text-sm mt-1">Danh sách các dịch vụ cung cấp</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Dịch Vụ
                </Button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue="ALL"
                onFilterChange={() => { }}
                filterOptions={[]} // Hide status filter by passing empty options if needed, but TableFilters currently always shows it. 
                // I'll update TableFilters to optionally hide the dropdown if filterOptions is empty.
                onReset={() => setSearchTerm('')}
                searchPlaceholder="Tìm tên dịch vụ..."
            />

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách dịch vụ...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        {renderSortableHeader('Tên Dịch Vụ', 'name')}
                                        {renderSortableHeader('Giá vốn', 'costPrice')}
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Công việc đầu ra</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Xem chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedServices.map((service) => (
                                        <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium uppercase">{service.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-bold">{formatCurrency(service.costPrice)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-bold">{service.outputJob?.name}</td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <button
                                                    onClick={() => navigate(`/services/${service.id}`)}
                                                    className="text-white bg-blue-600 rounded-xl px-4 py-1.5 font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {services.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-16 text-center text-gray-400 italic">
                                                Không tìm thấy dịch vụ nào
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

            <CreateServiceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
