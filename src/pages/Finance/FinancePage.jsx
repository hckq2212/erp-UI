import { useState, useMemo } from 'react';
import {
    Wallet,
    Calendar as CalendarIcon,
    List,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    RefreshCw,
    FileText
} from 'lucide-react';
import { useGetContractsQuery } from '../../api/contracts';
import { useGetDebtsQuery } from '../../api/debts';
import { useGetPaymentMilestonesQuery } from '../../api/paymentMilestones';
import { ContractDebtList } from '../../components/finance/ContractDebtList';
import { FinanceSchedule } from '../../components/finance/FinanceSchedule';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';

export const FinancePage = () => {
    const [viewType, setViewType] = useState('list'); // 'list' | 'schedule'

    // Fetch all necessary data
    const { data: contractsResponse = { data: [] }, isLoading: loadingContracts, refetch: refetchContracts } = useGetContractsQuery();
    const contracts = contractsResponse?.data || [];
    const { data: debts = [], isLoading: loadingDebts, refetch: refetchDebts } = useGetDebtsQuery();
    const { data: milestones = [], isLoading: loadingMilestones, refetch: refetchMilestones } = useGetPaymentMilestonesQuery();

    const stats = useMemo(() => {
        // Total revenue is based on all planned milestones
        const total = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

        // Collected is the sum of all payments across all debts
        const collected = debts.reduce((sum, d) => {
            const payments = d.payments?.reduce((pSum, p) => pSum + Number(p.amount || 0), 0) || 0;
            return sum + payments;
        }, 0);

        const pending = total - collected;
        const collectionRate = total > 0 ? (collected / total) * 100 : 0;

        return { total, collected, pending, collectionRate };
    }, [milestones, debts]);

    const isLoading = loadingContracts || loadingDebts || loadingMilestones;

    const handleRefresh = () => {
        refetchContracts();
        refetchDebts();
        refetchMilestones();
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-blue-600" />
                        Quản Lý Tài Chính
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Theo dõi công nợ, lộ trình thanh toán và dòng tiền hợp đồng</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleRefresh}
                        className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-100 rounded-xl shadow-sm transition-all"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    </button>

                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm ml-auto md:ml-0">
                        <button
                            onClick={() => setViewType('list')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                viewType === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            )}
                        >
                            <List className="w-4 h-4" />
                            Hợp đồng
                        </button>
                        <button
                            onClick={() => setViewType('schedule')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                viewType === 'schedule' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            )}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Lịch trình
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng doanh thu dự kiến</p>
                    <h3 className="text-xl font-black text-gray-900">{formatCurrency(stats.total)}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {Math.round(stats.collectionRate)}%
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Đã thu hồi (Thực tế)</p>
                    <h3 className="text-xl font-black text-green-600">{formatCurrency(stats.collected)}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Công nợ cần thu</p>
                    <h3 className="text-xl font-black text-red-600">{formatCurrency(stats.pending)}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng số hợp đồng</p>
                    <h3 className="text-xl font-black text-gray-900">{contracts.length}</h3>
                </div>
            </div>

            {/* Main Content View */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu tài chính...</p>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    {viewType === 'list' ? (
                        <ContractDebtList contracts={contracts} debts={debts} milestones={milestones} />
                    ) : (
                        <FinanceSchedule contracts={contracts} debts={debts} milestones={milestones} />
                    )}
                </div>
            )}
        </div>
    );
};
