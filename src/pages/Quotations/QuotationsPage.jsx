import { useState, useMemo } from 'react';
import { QuotationTable } from '../../components/quotations/QuotationTable';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useGetQuotationsQuery, useDeleteQuotationMutation } from '../../api/quotations';
import { TableFilters } from '../../components/ui/TableFilters';

export const QuotationsPage = () => {
    const { data: quotationsData, isLoading } = useGetQuotationsQuery();
    const [deleteQuotation] = useDeleteQuotationMutation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Handle API returning wrapped data
    const rawQuotations = useMemo(() => {
        return Array.isArray(quotationsData) ? quotationsData : (quotationsData?.data || []);
    }, [quotationsData]);

    const quotations = useMemo(() => {
        return rawQuotations.filter(quote => {
            const matchesSearch =
                (quote.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (quote.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || quote.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [rawQuotations, searchTerm, statusFilter]);

    const handleCreate = () => {
        alert("Create Quotation Modal");
    };

    const handleEdit = (quote) => {
        alert(`Edit Quotation ${quote.code}`);
    };

    const handleDelete = async (id) => {
        if (confirm("Bạn có chắc muốn xóa báo giá này?")) {
            try {
                await deleteQuotation(id).unwrap();
            } catch (err) {
                console.error("Failed to delete quotation:", err);
            }
        }
    };

    const handleView = (quote) => {
        alert(`Xem chi tiết ${quote.code}`);
    };

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
    };

    const statusOptions = [
        { value: 'DRAFT', label: 'Bản nháp' },
        { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
        { value: 'APPROVED', label: 'Đã duyệt' },
        { value: 'REJECTED', label: 'Bị từ chối' },
        { value: 'SENT', label: 'Đã gửi' },
        { value: 'ACCEPTED', label: 'Khách hàng chấp nhận' },
        { value: 'EXPIRED', label: 'Hết hạn' },
    ];

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Đang tải danh sách báo giá...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản Lý Báo Giá</h1>
                    <p className="text-gray-500 text-sm mt-1">Danh sách các báo giá gửi cho khách hàng</p>
                </div>
                <Button onClick={handleCreate} className="w-full md:w-auto shadow-lg shadow-blue-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Báo Giá
                </Button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue={statusFilter}
                onFilterChange={setStatusFilter}
                filterOptions={statusOptions}
                searchPlaceholder="Tìm mã báo giá, tên khách hàng..."
                onReset={handleReset}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <QuotationTable
                    quotations={quotations}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                />
            </div>
        </div>
    );
};
