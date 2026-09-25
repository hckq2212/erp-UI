import { useState, useMemo } from 'react';
import { ContractTable } from '../../components/contracts/ContractTable';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useGetContractsQuery } from '../../api/contracts';
import { TableFilters } from '../../components/ui/TableFilters';
import { useGetMeQuery } from '../../api/auth';
import { ContractModal } from './ContractModal';

export const ContractsPage = () => {
    const [filters, setFilters] = useState({
        search: '',
        status: 'ALL',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC'
    });

    const { data: data, isLoading: isLoadingContracts } = useGetContractsQuery(filters);
    const { data: currentUser } = useGetMeQuery();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const contracts = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };
    // const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'BOD';

    const handleFilterChange = (key, value) => {
        if (key === 'status') {
            const formattedValue = Array.isArray(value)
                ? (value.length > 0 ? value.join(',') : 'ALL')
                : (value || 'ALL');
            setFilters(prev => ({ ...prev, status: formattedValue, page: 1 }));
            return;
        }
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (sortBy, sortDir) => {
        setFilters(prev => ({ ...prev, sortBy, sortDir, page: 1 }));
    };

    const handleReset = () => {
        setFilters({
            search: '',
            status: 'ALL',
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortDir: 'DESC'
        });
    };

    const statusOptions = useMemo(() => [
        { value: 'DRAFT', label: 'Mới' },
        { value: 'PROPOSAL_UPLOADED', label: 'Đã tải lên hợp đồng' },
        { value: 'PROPOSAL_APPROVED', label: 'Đã duyệt hợp đồng' },
        { value: 'PROPOSAL_REJECTED', label: 'Bị từ chối hợp đồng' },
        { value: 'SIGNED', label: 'Đã ký' },
        { value: 'COMPLETED', label: 'Hoàn thành' },
        { value: 'CANCELLED', label: 'Đã hủy' },
    ], []);

    if (isLoadingContracts) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách hợp đồng...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản Lý Hợp Đồng</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý và theo dõi các hợp đồng đã ký kết</p>
                </div>
                {/* {canCreate && (
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700 transition-all font-semibold"
                    >
                        <Plus className="w-5 h-5" /> Tạo Hợp Đồng
                    </Button>
                )} */}
            </div>

            <TableFilters
                searchTerm={filters.search}
                onSearchChange={(val) => handleFilterChange('search', val)}
                filterValue={filters.status === 'ALL' ? [] : filters.status.split(',')}
                onFilterChange={(val) => handleFilterChange('status', val)}
                filterOptions={statusOptions}
                filterPlaceholder="Tất cả trạng thái"
                searchPlaceholder="Tìm mã hợp đồng, tên khách hàng..."
                isMulti={true}
                isSearchable={true}
                onReset={handleReset}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ContractTable
                    contracts={contracts}
                    meta={meta}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                    currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDir }}
                />
            </div>

            <ContractModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};
