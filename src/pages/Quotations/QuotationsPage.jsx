import { useState } from 'react';
import { QuotationTable } from '../../components/quotations/QuotationTable';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';

export const QuotationsPage = () => {
    const { data: quotationsData, isLoading } = useQuotations();
    const deleteQuotation = useDeleteQuotation();
    
    // Handle API returning wrapped data
    const quotations = Array.isArray(quotationsData) ? quotationsData : (quotationsData?.data || []);

    const handleCreate = () => {
        alert("Create Quotation Modal");
    };

    const handleEdit = (quote) => {
        alert(`Edit Quotation ${quote.code}`);
    };

    const handleDelete = (id) => {
        if(confirm("Delete this quotation?")) {
             deleteQuotation.mutate(id);
        }
    };

    const handleView = (quote) => {
        alert(`View details ${quote.code}`);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Báo Giá</h1>
                <Button onClick={handleCreate}>
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Báo Giá
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
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
