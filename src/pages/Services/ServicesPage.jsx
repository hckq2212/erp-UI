import { useNavigate } from 'react-router-dom';
import { useGetServicesQuery, useDeleteServiceMutation, useCreateServiceMutation, useBulkDeleteServicesMutation } from '../../api/services';
import { useGetMeQuery } from '../../api/auth';
import { formatCurrency } from '../../utils/format';
import { Plus, ArrowUp, ArrowDown, ArrowUpDown, Copy, Trash2, X, CheckSquare, Square, Pencil, ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState, useMemo, Fragment } from 'react';
import { CreateServiceModal } from './CreateServiceModal';
import { EditServiceModal } from './EditServiceModal';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../../components/ui/Pagination';
import { TableFilters } from '../../components/ui/TableFilters';
import { cn as cnUtility } from '../../utils/cn';
import { toast } from 'react-toastify';

export const ServicesPage = () => {
    const navigate = useNavigate();
    const { data: servicesData = [], isLoading } = useGetServicesQuery();
    const { data: me } = useGetMeQuery();
    const [createService] = useCreateServiceMutation();
    const [bulkDeleteServices, { isLoading: isDeleting }] = useBulkDeleteServicesMutation();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (id) =>
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const services = useMemo(() => {
        const rawData = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
        return rawData.filter(service =>
            (service.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (service.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [servicesData, searchTerm]);

    const handleCopy = async (service) => {
        try {
            const { id, createdAt, updatedAt, serviceJobs, ...rest } = service;

            // Map serviceJobs to jobIds and outputJobIds to create new associations
            const jobIds = serviceJobs ? serviceJobs.map(sj => sj.jobId) : [];
            const outputJobIds = serviceJobs ? serviceJobs.filter(sj => sj.isOutput).map(sj => sj.jobId) : [];

            await createService({
                ...rest,
                name: `${service.name} (Copy)`,
                jobIds,
                outputJobIds
            }).unwrap();
            toast.success('Đã sao chép dịch vụ');
        } catch (err) {
            toast.error('Lỗi khi sao chép dịch vụ');
        }
    };

    const handleEdit = (service) => {
        setSelectedService(service);
        setIsEditModalOpen(true);
    };

    const {
        data: paginatedServices,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(services, { initialSort: { key: 'code', direction: 'ascending' } });

    const expandableIds = paginatedServices.filter(s => (s.serviceJobs || []).length > 0).map(s => s.id);
    const allExpanded = expandableIds.length > 0 && expandableIds.every(id => expandedIds.includes(id));
    const handleToggleAll = () => setExpandedIds(allExpanded ? [] : expandableIds);

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds([]);
        setExpandedIds([]);
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === paginatedServices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedServices.map(s => s.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} dịch vụ đã chọn?`)) return;

        try {
            await bulkDeleteServices(selectedIds).unwrap();
            toast.success(`Đã xóa ${selectedIds.length} dịch vụ`);
            setSelectedIds([]);
            setIsSelectionMode(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Lỗi khi xóa dịch vụ');
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
                <div className="flex items-center gap-3">
                    {['ADMIN', 'BOD', 'BD'].includes(me?.role) && !isSelectionMode && (
                        <>
                            <Button
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={handleToggleSelectionMode}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa dịch vụ
                            </Button>
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm Dịch Vụ
                            </Button>
                        </>
                    )}
                    {isSelectionMode && (
                        <>
                            <span className="text-sm font-medium text-gray-600 mr-2">
                                Đã chọn <span className="text-blue-600 font-bold">{selectedIds.length}</span> dịch vụ
                            </span>
                            <Button
                                variant="outline"
                                onClick={handleToggleSelectionMode}
                                className="border-gray-200"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Hủy
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleBulkDelete}
                                disabled={selectedIds.length === 0 || isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue="ALL"
                onFilterChange={() => { }}
                filterOptions={[]} // Hide status filter by passing empty options if needed, but TableFilters currently always shows it. 
                // I'll update TableFilters to optionally hide the dropdown if filterOptions is empty.
                onReset={() => setSearchTerm('')}
                searchPlaceholder="Tìm mã dịch vụ, tên dịch vụ..."
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
                                        {isSelectionMode && (
                                            <th className="px-6 py-4 w-10">
                                                <button
                                                    onClick={handleSelectAll}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {selectedIds.length === paginatedServices.length && paginatedServices.length > 0 ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </th>
                                        )}
                                        {!isSelectionMode && (
                                            <th className="pl-4 pr-0 py-4 w-10">
                                                <button
                                                    onClick={handleToggleAll}
                                                    disabled={expandableIds.length === 0}
                                                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                                    title={allExpanded ? 'Thu gọn tất cả hạng mục' : 'Mở rộng tất cả hạng mục'}
                                                >
                                                    {allExpanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
                                                </button>
                                            </th>
                                        )}
                                        {renderSortableHeader('Tên Dịch Vụ', 'name')}
                                        {renderSortableHeader('Mã Dịch Vụ', 'code')}
                                        {renderSortableHeader('Đơn vị', 'unit')}
                                        {renderSortableHeader('Giá vốn', 'costPrice')}
                                        {!isSelectionMode && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedServices.map((service) => {
                                        const jobs = service.serviceJobs || [];
                                        const isExpanded = !isSelectionMode && expandedIds.includes(service.id);
                                        return (
                                        <Fragment key={service.id}>
                                        <tr
                                            className={cnUtility(
                                                "hover:bg-gray-50/50 transition-colors cursor-pointer",
                                                selectedIds.includes(service.id) && "bg-blue-50/50 hover:bg-blue-50"
                                            )}
                                            onClick={() => isSelectionMode && handleSelectRow(service.id)}
                                        >
                                            {isSelectionMode && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        {selectedIds.includes(service.id) ? (
                                                            <CheckSquare className="w-5 h-5 text-blue-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-gray-300" />
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {!isSelectionMode && (
                                                <td className="pl-4 pr-0 py-4 w-10">
                                                    {jobs.length > 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleExpand(service.id); }}
                                                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                                            title={isExpanded ? 'Thu gọn hạng mục' : 'Xem hạng mục cấu thành'}
                                                            aria-expanded={isExpanded}
                                                        >
                                                            <ChevronRight className={cnUtility("w-4 h-4 transition-transform", isExpanded && "rotate-90 text-blue-600")} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium uppercase">
                                                <div className="flex items-center gap-2">
                                                    <span>{service.name}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (jobs.length && !isSelectionMode) toggleExpand(service.id); }}
                                                        className={cnUtility(
                                                            "px-2 py-0.5 rounded-full text-[11px] font-semibold normal-case",
                                                            jobs.length === 0 ? "bg-gray-100 text-gray-400 cursor-default"
                                                                : isExpanded ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                        )}
                                                    >
                                                        {jobs.length} hạng mục
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-blue-600 font-bold">{service.code}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 italic lowercase">{service.unit || '---'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-bold">{formatCurrency(service.costPrice)}</td>
                                            {!isSelectionMode && (
                                                <td className="px-6 py-4 text-sm text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {['ADMIN', 'BOD'].includes(me?.role) && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCopy(service);
                                                                    }}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Nhân bản dịch vụ"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEdit(service);
                                                                    }}
                                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                    title="Sửa dịch vụ"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => navigate(`/services/${service.id}`)}
                                                            className="text-white bg-blue-600 rounded-xl px-4 py-1.5 font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                        >
                                                            Xem chi tiết
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-gray-50/60">
                                                <td colSpan={6} className="px-6 pb-4 pt-0">
                                                    <div className="ml-10 border-l-2 border-blue-100 pl-4">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-gray-400 uppercase tracking-wider">
                                                                    <th className="py-2 text-left font-semibold w-28">Mã</th>
                                                                    <th className="py-2 text-left font-semibold">Hạng mục</th>
                                                                    <th className="py-2 text-center font-semibold w-16">SL</th>
                                                                    <th className="py-2 text-center font-semibold w-20">Đầu ra</th>
                                                                    <th className="py-2 text-right font-semibold w-36">Giá vốn</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {jobs.map(sj => (
                                                                    <tr key={sj.id} className="hover:bg-white transition-colors">
                                                                        <td className="py-1.5 font-mono text-gray-500">{sj.job?.code}</td>
                                                                        <td className="py-1.5">
                                                                            <button
                                                                                onClick={() => navigate(`/jobs/${sj.jobId}`)}
                                                                                className="text-gray-700 hover:text-blue-600 hover:underline text-left"
                                                                            >
                                                                                {sj.job?.name}
                                                                            </button>
                                                                        </td>
                                                                        <td className="py-1.5 text-center text-gray-600">×{sj.quantity || 1}</td>
                                                                        <td className="py-1.5 text-center">
                                                                            {sj.isOutput && <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-semibold">Đầu ra</span>}
                                                                        </td>
                                                                        <td className="py-1.5 text-right text-gray-600 font-medium">
                                                                            {formatCurrency((sj.job?.costPrice || 0) * (sj.quantity || 1))}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </Fragment>
                                        );
                                    })}
                                    {services.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center text-gray-400 italic">
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

            <EditServiceModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedService(null);
                }}
                service={selectedService}
            />
        </div>
    );
};
