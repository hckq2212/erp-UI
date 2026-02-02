import { useState, useMemo } from 'react';
import { ContractTable } from '../../components/contracts/ContractTable';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useGetContractsQuery } from '../../api/contracts';
import { TableFilters } from '../../components/ui/TableFilters';

export const ContractsPage = () => {
    const { data: contractsData, isLoading: isLoadingContracts } = useGetContractsQuery();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Handle API returning wrapped data
    const contracts = useMemo(() => {
        const rawData = Array.isArray(contractsData) ? contractsData : (contractsData?.data || []);
        return rawData.filter(contract => {
            const matchesSearch =
                (contract.contractCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (contract.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || contract.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [contractsData, searchTerm, statusFilter]);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
    };

    const statusOptions = [
        { value: 'Pending', label: 'Chờ xử lý' },
        { value: 'Active', label: 'Đang hiệu lực' },
        { value: 'Expired', label: 'Hết hạn' },
        { value: 'Terminated', label: 'Đã thanh lý' },
    ];

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
                <Button className="w-full md:w-auto shadow-lg shadow-blue-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Hợp Đồng
                </Button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue={statusFilter}
                onFilterChange={setStatusFilter}
                filterOptions={statusOptions}
                searchPlaceholder="Tìm mã hợp đồng, tên khách hàng..."
                onReset={handleReset}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ContractTable
                    contracts={contracts}
                />
            </div>
        </div>
    );
};
