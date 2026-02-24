import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OpportunityTable } from './OpportunityTable';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useGetOpportunitiesQuery } from '../../api/opportunities';
import { OpportunityModal } from './OpportunityModal';
import { TableFilters } from '../../components/ui/TableFilters';

const COLUMNS = [
    { id: 'OPEN', title: 'Mới' },
    { id: 'PENDING_OPP_APPROVAL', title: 'Đang chờ duyệt' },
    { id: 'OPP_APPROVED', title: 'Đã Duyệt' },
    { id: 'QUOTATION', title: 'Báo Giá' },
    { id: 'QUOTATION_DRAFTING', title: 'Đang làm báo giá' },
    { id: 'PENDING_QUOTE_APPROVAL', title: 'Chờ duyệt báo giá' },
    { id: 'QUOTE_APPROVED', title: 'Đã duyệt báo giá' },
    { id: 'CONTRACT_CREATED', title: 'Đã tạo hợp đồng' },
    { id: 'PROJECT_ASSIGNED', title: 'Đã giao dự án' },
    { id: 'IMPLEMENTATION', title: 'Triển Khai' }
];

export const OpportunitiesPage = () => {
    const [filters, setFilters] = useState({
        search: '',
        status: 'ALL',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC'
    });

    const { data, isLoading } = useGetOpportunitiesQuery(filters);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const opportunities = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };

    const handleFilterChange = (key, value) => {
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

    const statusOptions = COLUMNS.map(col => ({ value: col.id, label: col.title }));

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách cơ hội...</p>
        </div>
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center space-x-6">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản Lý Cơ Hội</h1>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-blue-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Cơ Hội Mới
                </Button>
            </div>

            <TableFilters
                searchTerm={filters.search}
                onSearchChange={(val) => handleFilterChange('search', val)}
                filterValue={filters.status}
                onFilterChange={(val) => handleFilterChange('status', val)}
                filterOptions={statusOptions}
                searchPlaceholder="Tìm tên cơ hội, khách hàng..."
                onReset={handleReset}
            />

            <OpportunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(data) => {
                    setIsModalOpen(false);
                    if (data?.id) {
                        navigate(`/opportunities/${data.id}`);
                    }
                }}
            />

            <div className="flex-1 overflow-auto">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
                    <OpportunityTable
                        opportunities={opportunities}
                        meta={meta}
                        onPageChange={handlePageChange}
                        onSortChange={handleSortChange}
                        currentSort={{ sortBy: filters.sortBy, sortDir: filters.sortDir }}
                        onEdit={(opp) => {
                            console.log('Editing:', opp.name);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
