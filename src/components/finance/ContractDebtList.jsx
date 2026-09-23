import { useMemo, useState } from 'react';
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
    Pencil,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useActivateDebtMutation } from '../../api/debts';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';
import { DebtDetailsModal } from './DebtDetailsModal';
import { MilestoneModal } from './MilestoneModal';
import { useTableFeatures } from '../../hooks/useTableFeatures';
import { Pagination } from '../ui/Pagination';

export const ContractDebtList = ({ contracts = [], debts = [], milestones = [] }) => {
    const [expandedContracts, setExpandedContracts] = useState(new Set());
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activateDebt, { isLoading: activatingDebt }] = useActivateDebtMutation();
    const [activatingMilestoneId, setActivatingMilestoneId] = useState(null);

    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [planContract, setPlanContract] = useState(null);
    const [focusMilestoneId, setFocusMilestoneId] = useState(null);

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

    const {
        data: paginatedContracts,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(contracts, { initialSort: { key: 'contractCode', direction: 'ascending' } });

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

    const openPlanModal = (contract, milestoneId) => {
        setPlanContract(contract);
        setFocusMilestoneId(milestoneId || null);
        setIsPlanModalOpen(true);
    };

    const handleActivateDebt = async (milestoneId) => {
        if (!milestoneId) return;
        try {
            setActivatingMilestoneId(String(milestoneId));
            await activateDebt({ milestoneId }).unwrap();
            toast.success('Đã kích hoạt công nợ cho đợt thanh toán này');
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể kích hoạt công nợ');
        } finally {
            setActivatingMilestoneId(null);
        }
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
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm"
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
            )}
        >
            {label}
            {getSortIcon(sortKey)}
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Sorting Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50/50 rounded-2xl border border-slate-100 mb-2">
                <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200">
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
                            "bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
                            isExpanded ? "shadow-xl shadow-slate-200/40 border-indigo-200/60" : "shadow-sm border-slate-100 hover:border-slate-200"
                        )}>
                            {/* Contract Header */}
                            <div
                                className={cn(
                                    "p-6 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer transition-colors gap-6",
                                    isExpanded ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                                )}
                                onClick={() => toggleContract(contract.id)}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                                        isExpanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 rotate-90" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-none mb-2 uppercase">
                                            {contract.customer?.name || 'Khách lẻ'}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5 text-indigo-500">
                                                <FileText size={14} className="opacity-70" />
                                                {contract.contractCode || `HĐ #${contract.id}`}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-slate-900 font-extrabold">{formatCurrency(sellingPrice)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                    <div className="text-right">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Đã thu</p>
                                        <p className="text-sm font-extrabold text-emerald-600">{formatCurrency(totalPaid)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Cần thu</p>
                                        <p className={cn(
                                            "text-sm font-extrabold",
                                            totalDebt > 0 ? "text-rose-500" : "text-emerald-600"
                                        )}>{formatCurrency(totalDebt)}</p>
                                    </div>
                                    <div className="flex-1 md:w-32 hidden sm:block">
                                        <div className="flex justify-between items-center mb-1 text-[9px] font-bold text-slate-400 tracking-widest">
                                            <span>TIẾN ĐỘ THU</span>
                                            <span>{progressPercent}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-700 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Milestone List (Journey) */}
                            {isExpanded && (
                                <div className="p-8 bg-white border-t border-slate-100">
                                    <div className="relative space-y-4">
                                        {/* Timeline Line */}
                                        <div className="absolute left-5 top-1 bottom-1 w-0.5 bg-slate-100/50" />

                                        {contractMilestones.map((m) => {
                                            const overdue = m.status === 'ACTIVE' && m.dueDate && new Date(m.dueDate) < new Date();
                                            const amount = Number(m.amount || 0);
                                            const remaining = Number(m.remaining || 0);
                                            const paid = Math.max(0, amount - remaining);
                                            const progressPercent = amount > 0 ? Math.min(100, Math.round((paid / amount) * 100)) : 0;

                                            return (
                                                <div key={m.id} className="relative flex gap-4 items-start group">
                                                    {/* Node Icon */}
                                                    <div className={cn(
                                                        "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 shrink-0",
                                                        m.status === 'COMPLETED' ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100/40" :
                                                            m.status === 'ACTIVE' && overdue ? "bg-rose-50 backdrop-blur-sm border-rose-500 text-rose-600 shadow-lg shadow-rose-100/40" :
                                                            m.status === 'ACTIVE' ? "bg-white/90 backdrop-blur-sm border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-100/40" :
                                                                "bg-white/90 backdrop-blur-sm border-slate-100 text-slate-300"
                                                    )}>
                                                        {m.status === 'COMPLETED' ? <CheckCircle2 size={20} /> :
                                                            m.status === 'ACTIVE' ? <CreditCard size={20} className={overdue ? "animate-pulse text-rose-500" : ""} /> :
                                                                <Clock size={20} />}
                                                    </div>

                                                    {/* Content */}
                                                    <div className={cn(
                                                        "flex-1 p-4 rounded-2xl border transition-all duration-500 min-w-0",
                                                        m.status !== 'PLANNED' && overdue
                                                            ? "bg-rose-50/30 border-rose-200 group-hover:bg-rose-50/50 group-hover:border-rose-300/50"
                                                            : m.status !== 'PLANNED'
                                                                ? "bg-slate-50/50 border-slate-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100/50"
                                                                : "bg-white border-dashed border-slate-200 opacity-60"
                                                    )}>
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="min-w-0 font-extrabold text-slate-800 uppercase text-xs tracking-tight truncate">
                                                                        {m.name || 'Mốc thanh toán'}
                                                                    </h4>
                                                                    {typeof m.percentage !== 'undefined' && m.percentage !== null && (
                                                                        <span className="px-1.5 py-0.5 bg-slate-200/50 rounded text-[9px] font-bold text-slate-500 whitespace-nowrap">
                                                                            {m.percentage}%
                                                                        </span>
                                                                    )}
                                                                    {m.status === 'PLANNED' && (
                                                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                                            Chưa kích hoạt
                                                                        </span>
                                                                    )}
                                                                    {m.status === 'ACTIVE' && (
                                                                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                                            Đang thu
                                                                        </span>
                                                                    )}
                                                                    {m.status === 'COMPLETED' && (
                                                                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                                            Đã thu
                                                                        </span>
                                                                    )}
                                                                    {overdue && (
                                                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                                            Quá hạn
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="mt-1 text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                                                    <Calendar size={12} />
                                                                    Hạn: {m.dueDate ? new Date(m.dueDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-start shrink-0">
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Giá trị</p>
                                                                    <p className="text-sm font-extrabold text-slate-900">{formatCurrency(amount)}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Còn nợ</p>
                                                                    <p className={cn(
                                                                        "text-sm font-extrabold",
                                                                        m.status === 'PLANNED'
                                                                            ? "text-slate-400"
                                                                            : remaining > 0 && m.status === 'ACTIVE'
                                                                                ? "text-rose-600"
                                                                                : m.status === 'COMPLETED'
                                                                                    ? "text-emerald-700"
                                                                                    : "text-slate-500"
                                                                    )}>
                                                                        {m.status === 'PLANNED' ? '—' : formatCurrency(remaining)}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {m.status === 'PLANNED' && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={activatingDebt && activatingMilestoneId === String(m.id)}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleActivateDebt(m.id);
                                                                            }}
                                                                            className={cn(
                                                                                "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                                                activatingDebt && activatingMilestoneId === String(m.id)
                                                                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                                                    : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                                                            )}
                                                                            title="Kích hoạt công nợ"
                                                                        >
                                                                            {activatingDebt && activatingMilestoneId === String(m.id) ? 'Đang kích hoạt…' : 'Kích hoạt'}
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openPlanModal(contract, m.id);
                                                                        }}
                                                                        className="p-2 bg-white text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                                                        title="Chỉnh sửa lộ trình"
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </button>
                                                                </div>
                                                                {m.debt && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDebtDetails(m.debt);
                                                                        }}
                                                                        className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                                                                        title="Chi tiết"
                                                                    >
                                                                        <ArrowRight size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {m.status !== 'PLANNED' && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                                    <span>Tiến độ</span>
                                                                    <span>{progressPercent}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full transition-all duration-700",
                                                                            m.status === 'COMPLETED' ? "bg-emerald-500" : "bg-indigo-500"
                                                                        )}
                                                                        style={{ width: `${progressPercent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
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

                {contracts.length === 0 && (
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

            <MilestoneModal
                isOpen={isPlanModalOpen}
                onClose={() => {
                    setIsPlanModalOpen(false);
                    setPlanContract(null);
                    setFocusMilestoneId(null);
                }}
                contractId={planContract?.id}
                sellingPrice={Number(planContract?.sellingPrice || planContract?.selling_price || 0)}
                initialFocusMilestoneId={focusMilestoneId}
                isReadOnly={
                    ['COMPLETED', 'CANCELLED'].includes(planContract?.status) ||
                    ['COMPLETED', 'CANCELLED'].includes(planContract?.project?.status)
                }
            />
        </div>
    );
};
