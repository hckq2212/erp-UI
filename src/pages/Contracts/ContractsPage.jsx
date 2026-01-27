import { useState } from 'react';
import { ContractTable } from '../../components/contracts/ContractTable';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';

export const ContractsPage = () => {

    // Handle API returning wrapped data
    const contracts = Array.isArray(contractsData) ? contractsData : (contractsData?.data || []);

    const handleCreate = () => {
        alert("Create Contract Modal");
    };

    const handleEdit = (contract) => {
        alert(`Edit Contract ${contract.code}`);
    };

    const handleDelete = (id) => {
        if(confirm("Delete this contract?")) {
            deleteContract.mutate(id);
        }
    };

    const handleView = (contract) => {
        alert(`View details ${contract.code}`);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Hợp Đồng</h1>
                <Button onClick={handleCreate}>
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Hợp Đồng
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ContractTable 
                    contracts={contracts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                />
            </div>
        </div>
    );
};
