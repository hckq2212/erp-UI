import { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowRight,
    Clock,
    TrendingUp,
    CreditCard,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Filter
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';
import { DebtDetailsModal } from './DebtDetailsModal';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';
import { TableFilters } from '../ui/TableFilters';

export const ContractDebtList = ({ contracts = [], debts = [], milestones = [] }) => {
    const [expandedContracts, setExpandedContracts] = useState(new Set());
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debtStatusFilter, setDebtStatusFilter] = useState('ALL');

    // Group milestones by contractId and merge with debt/payment info
    const milestonesByContract = useMemo(() => {
        const grouped = {};

        milestones.forEach(milestone => {
            const contractId = milestone.contractId || milestone.contract?.id;
            if (!contractId) return;

            if (!grouped[contractId]) {
                grouped[contractId] = [];
            }

            // Find matching debt for this milestone
            const debt = debts.find(d => d.milestoneId === milestone.id || d.milestone?.id === milestone.id);
            const amount = Number(milestone.amount || 0);

            let paidAmount = 0;
            let payments = [];
            let status = 'PLANNED';

            if (debt) {
                payments = debt.payments?.map(p => ({
                    ...p,
                    amount: Number(p.amount || 0)
                })) || [];
                paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
                status = paidAmount >= amount ? 'COMPLETED' : 'ACTIVE';
            }

            grouped[contractId].push({
                ...milestone,
                debt,
                payments,
                paidAmount,
                status,
                remaining: Math.max(0, amount - paidAmount)
            });
        });
        return grouped;
    }, [milestones, debts]);

    const filteredContracts = useMemo(() => {
        if (!Array.isArray(contracts)) return [];
        return contracts.filter(contract => {
            const matchesSearch =
                (contract.contractCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (contract.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (debtStatusFilter === 'ALL') return true;

            const contractMilestones = milestonesByContract[contract.id] || [];
            const hasDebt = contractMilestones.some(m => m.status === 'ACTIVE' && m.remaining > 0);

            if (debtStatusFilter === 'HAS_DEBT') return hasDebt;
            if (debtStatusFilter === 'NO_DEBT') return !hasDebt;

            return true;
        });
    }, [contracts, searchTerm, debtStatusFilter, milestonesByContract]);

    const {
        data: paginatedContracts,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(filteredContracts, { initialSort: { key: 'contractCode', direction: 'ascending' } });

    const toggleContract = (contractId) => {
        const newExpanded = new Set(expandedContracts);
        if (newExpanded.has(contractId)) {
            newExpanded.delete(contractId);
        } else {
            newExpanded.add(contractId);
        }
        setExpandedContracts(newExpanded);
    };

    const openDebtDetails = (debt) => {
        setSelectedDebt(debt);
        setIsModalOpen(true);
    };

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortButton = (label, sortKey) => (
        <button
            onClick={() => requestSort(sortKey)}
            className={cn(
                "flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                sortConfig?.key === sortKey
                    ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
            )}
        >
            {label}
            {getSortIcon(sortKey)}
        </button>
    );

    const handleReset = () => {
        setSearchTerm('');
        setDebtStatusFilter('ALL');
    };

    const debtStatusOptions = [
        { value: 'HAS_DEBT', label: 'Còn nợ cần thu' },
        { value: 'NO_DEBT', label: 'Đã hoàn thành thu' },
    ];

    return (
        <div className="space-y-6">
            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterValue={debtStatusFilter}
                onFilterChange={setDebtStatusFilter}
                filterOptions={debtStatusOptions}
                filterPlaceholder="Lọc theo tình trạng nợ"
                searchPlaceholder="Tìm mã hợp đồng, khách hàng..."
                onReset={handleReset}
            />

            {/* Sorting Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50/50 rounded-2xl border border-gray-100 mb-2">
                <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200">
                    <Filter className="w-3 h-3" />
                    Sắp xếp theo
                </div>
                {renderSortButton('Mã Hợp Đồng', 'contractCode')}
                {renderSortButton('Khách Hàng', 'customer.name')}
                {renderSortButton('Giá Trị', 'sellingPrice')}
            </div>

            <div className="space-y-4">
                {paginatedContracts.map((contract) => {
                    const contractMilestones = milestonesByContract[contract.id] || [];
                    const totalPaid = contractMilestones.reduce((sum, m) => sum + m.paidAmount, 0);
                    const totalDebt = contractMilestones.reduce((sum, m) => sum + (m.status === 'ACTIVE' ? m.remaining : 0), 0);
                    const isExpanded = expandedContracts.has(contract.id);
                    const sellingPrice = Number(contract.sellingPrice || contract.selling_price || 0);
                    const progressPercent = sellingPrice > 0 ? Math.round((totalPaid / sellingPrice) * 100) : 0;

                    return (
                        <div key={contract.id} className={cn(
                            "bg-white rounded-3xl border transition-all duration-500 overflow-hidden",
                            isExpanded ? "shadow-xl border-blue-200" : "shadow-sm border-gray-100 hover:border-gray-200"
                        )}>
                            {/* Contract Header */}
                            <div
                                className={cn(
                                    "p-6 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer transition-colors gap-6",
                                    isExpanded ? "bg-blue-50/30" : "hover:bg-gray-50/50"
                                )}
                                onClick={() => toggleContract(contract.id)}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                                        isExpanded ? "bg-blue-600 text-white shadow-lg shadow-blue-100 rotate-90" : "bg-gray-50 text-gray-400"
                                    )}>
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-2 uppercase">
                                            {contract.contractCode || `HĐ #${contract.id}`}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5 text-blue-500">
                                                <FileText size={14} className="opacity-70" />
                                                {contract.customer?.name || 'Khách lẻ'}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span className="text-gray-900 font-black">{formatCurrency(sellingPrice)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đã thu</p>
                                        <p className="text-sm font-black text-green-600">{formatCurrency(totalPaid)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cần thu</p>
                                        <p className={cn(
                                            "text-sm font-black",
                                            totalDebt > 0 ? "text-red-500" : "text-green-600"
                                        )}>{formatCurrency(totalDebt)}</p>
                                    </div>
                                    <div className="flex-1 md:w-32 hidden sm:block">
                                        <div className="flex justify-between items-center mb-1 text-[9px] font-black text-gray-400">
                                            <span>TIẾN ĐỘ THU</span>
                                            <span>{progressPercent}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Milestone List (Journey) */}
                            {isExpanded && (
                                <div className="p-8 bg-white border-t border-gray-100">
                                    <div className="relative space-y-8">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-gray-100" />

                                        {contractMilestones.map((m, mIdx) => {
                                            const overdue = m.status === 'ACTIVE' && m.dueDate && new Date(m.dueDate) < new Date();

                                            return (
                                                <div key={m.id} className="relative flex gap-6 items-start group">
                                                    {/* Node Icon */}
                                                    <div className={cn(
                                                        "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
                                                        m.status === 'COMPLETED' ? "bg-green-600 border-green-500 text-white" :
                                                            m.status === 'ACTIVE' ? "bg-white border-blue-600 text-blue-600" :
                                                                "bg-white border-gray-100 text-gray-300"
                                                    )}>
                                                        {m.status === 'COMPLETED' ? <CheckCircle2 size={20} /> :
                                                            m.status === 'ACTIVE' ? <CreditCard size={20} className={overdue ? "animate-pulse text-red-500" : ""} /> :
                                                                <Clock size={20} />}
                                                    </div>

                                                    {/* Content */}
                                                    <div className={cn(
                                                        "flex-1 p-5 rounded-2xl border transition-all duration-300",
                                                        m.status !== 'PLANNED' ? "bg-gray-50/50 border-gray-100" : "bg-white border-dashed border-gray-200 opacity-60"
                                                    )}>
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-black text-gray-900 uppercase text-xs tracking-tight">{m.name}</h4>
                                                                    <span className="px-1.5 py-0.5 bg-gray-200/50 rounded text-[9px] font-black text-gray-500">
                                                                        {m.percentage}%
                                                                    </span>
                                                                    {overdue && (
                                                                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-black uppercase">
                                                                            Quá hạn
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                                                                    <Calendar size={12} />
                                                                    Hạn: {m.dueDate ? new Date(m.dueDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-6 self-end sm:self-center">
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Giá trị</p>
                                                                    <p className="text-sm font-black text-gray-900">{formatCurrency(m.amount)}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Còn nợ</p>
                                                                    <p className={cn(
                                                                        "text-sm font-black",
                                                                        m.remaining > 0 && m.status === 'ACTIVE' ? "text-red-500" :
                                                                            m.status === 'COMPLETED' ? "text-green-600" : "text-gray-400"
                                                                    )}>{formatCurrency(m.remaining)}</p>
                                                                </div>
                                                                {m.debt && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDebtDetails(m.debt);
                                                                        }}
                                                                        className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                                                    >
                                                                        <ArrowRight size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {contractMilestones.length === 0 && (
                                            <div className="py-12 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                                <AlertCircle size={40} className="text-gray-200 mb-4" />
                                                <p className="text-sm font-black text-gray-400 italic font-medium">Hợp đồng này chưa có lộ trình thanh toán nào.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredContracts.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-gray-400 font-bold italic">Không tìm thấy hợp đồng nào phù hợp.</p>
                    </div>
                )}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
            />

            <DebtDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                debt={selectedDebt}
                allDebts={debts}
            />
        </div>
    );
};
