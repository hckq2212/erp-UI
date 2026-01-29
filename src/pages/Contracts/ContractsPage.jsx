import { useState } from 'react';
import { ContractTable } from '../../components/contracts/ContractTable';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useGetContractsQuery } from '../../api/contracts';

export const ContractsPage = () => {
    const { data: contractsData, isLoading: isLoadingContracts } = useGetContractsQuery();

    // Handle API returning wrapped data
    const contracts = Array.isArray(contractsData) ? contractsData : (contractsData?.data || []);


    if (isLoadingContracts) return <div>Loading...</div>;
    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Hợp Đồng</h1>
                <Button>
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo Hợp Đồng
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ContractTable 
                    contracts={contracts}
                />
            </div>
        </div>
    );
};
