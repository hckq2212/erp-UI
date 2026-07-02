import { useEffect, useId, useMemo, useState } from 'react';
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
import { endOfMonth, endOfQuarter, format, parseISO, startOfMonth, startOfQuarter, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useGetContractsQuery } from '../../api/contracts';
import { useGetDebtsQuery } from '../../api/debts';
import { useGetPaymentMilestonesQuery } from '../../api/paymentMilestones';
import { ContractDebtList } from '../../components/finance/ContractDebtList';
import { FinanceSchedule } from '../../components/finance/FinanceSchedule';
import { FinanceToolbar } from '../../components/finance/FinanceToolbar';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toDateOnly = (value) => (typeof value === 'string' ? value.slice(0, 10) : '');
const toIsoDate = (date) => format(date, 'yyyy-MM-dd');

const getPresetRange = (preset, now = new Date()) => {
    if (preset === 'all') return { start: '', end: '' };
    if (preset === 'this_month') return { start: toIsoDate(startOfMonth(now)), end: toIsoDate(endOfMonth(now)) };
    if (preset === 'last_month') {
        const previousMonth = subMonths(now, 1);
        return { start: toIsoDate(startOfMonth(previousMonth)), end: toIsoDate(endOfMonth(previousMonth)) };
    }
    if (preset === 'this_quarter') return { start: toIsoDate(startOfQuarter(now)), end: toIsoDate(endOfQuarter(now)) };
    return { start: '', end: '' };
};

export const FinancePage = () => {
    const [viewType, setViewType] = useState('list'); // 'list' | 'schedule'
    const tabsId = useId();
    const listTabId = `${tabsId}-list`;
    const scheduleTabId = `${tabsId}-schedule`;
    const panelId = `${tabsId}-panel`;

    const [preset, setPreset] = useState('this_month'); // this_month | last_month | this_quarter | all | custom
    const initialRange = useMemo(() => getPresetRange('this_month', new Date()), []);
    const [rangeStart, setRangeStart] = useState(initialRange.start);
    const [rangeEnd, setRangeEnd] = useState(initialRange.end);
    const [searchTerm, setSearchTerm] = useState('');
    const [debtStatusFilter, setDebtStatusFilter] = useState('ALL'); // ALL | HAS_DEBT | NO_DEBT
    const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

    // Fetch all necessary data
    const { data: contractsResponse = { data: [] }, isLoading: loadingContracts, refetch: refetchContracts } = useGetContractsQuery();
    const contracts = contractsResponse?.data || [];
    const { data: debts = [], isLoading: loadingDebts, refetch: refetchDebts } = useGetDebtsQuery();
    const { data: milestones = [], isLoading: loadingMilestones, refetch: refetchMilestones } = useGetPaymentMilestonesQuery();

    const isLoading = loadingContracts || loadingDebts || loadingMilestones;

    const handleRefresh = () => {
        refetchContracts();
        refetchDebts();
        refetchMilestones();
        setLastRefreshedAt(new Date());
    };

    const handleTabsKeyDown = (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        setViewType((prev) => (prev === 'list' ? 'schedule' : 'list'));
    };

    useEffect(() => {
        if (!isLoading && !lastRefreshedAt) setLastRefreshedAt(new Date());
    }, [isLoading, lastRefreshedAt]);

    const handlePresetChange = (nextPreset) => {
        setPreset(nextPreset);
        if (nextPreset === 'custom') return;
        const nextRange = getPresetRange(nextPreset, new Date());
        setRangeStart(nextRange.start);
        setRangeEnd(nextRange.end);
    };

    const handleRangeStartChange = (nextStart) => {
        const next = typeof nextStart === 'string' ? nextStart : '';
        if (!next || !rangeEnd || next <= rangeEnd) {
            setRangeStart(next);
            return;
        }
        setRangeStart(rangeEnd);
        setRangeEnd(next);
    };

    const handleRangeEndChange = (nextEnd) => {
        const next = typeof nextEnd === 'string' ? nextEnd : '';
        if (!next || !rangeStart || rangeStart <= next) {
            setRangeEnd(next);
            return;
        }
        setRangeEnd(rangeStart);
        setRangeStart(next);
    };

    const handleReset = () => {
        setPreset('this_month');
        const nextRange = getPresetRange('this_month', new Date());
        setRangeStart(nextRange.start);
        setRangeEnd(nextRange.end);
        setSearchTerm('');
        setDebtStatusFilter('ALL');
    };

    const effectiveRange = useMemo(() => {
        if (preset === 'all') return null;
        if (!rangeStart || !rangeEnd) return null;
        return { start: rangeStart, end: rangeEnd };
    }, [preset, rangeStart, rangeEnd]);

    const milestoneToContractId = useMemo(() => {
        const map = new Map();
        milestones.forEach((m) => {
            if (!m?.id) return;
            const contractId = m.contractId || m.contract?.id;
            if (!contractId) return;
            map.set(String(m.id), String(contractId));
        });
        return map;
    }, [milestones]);

    const paidByMilestoneId = useMemo(() => {
        const map = new Map();
        debts.forEach((d) => {
            const milestoneId = d?.milestoneId || d?.milestone?.id;
            if (!milestoneId) return;
            const totalPaid = Number(
                d.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
            );
            const key = String(milestoneId);
            map.set(key, (map.get(key) || 0) + totalPaid);
        });
        return map;
    }, [debts]);

    const milestonesInRange = useMemo(() => {
        if (!Array.isArray(milestones)) return [];
        if (!effectiveRange) return milestones;
        return milestones.filter((m) => {
            const dueDate = toDateOnly(m?.dueDate);
            if (!dueDate) return false;
            return effectiveRange.start <= dueDate && dueDate <= effectiveRange.end;
        });
    }, [milestones, effectiveRange]);

    const contractsFiltered = useMemo(() => {
        if (!Array.isArray(contracts)) return [];
        const lower = (searchTerm || '').trim().toLowerCase();

        const milestonesByContract = new Map();
        milestonesInRange.forEach((m) => {
            const contractId = m.contractId || m.contract?.id;
            if (!contractId) return;
            const key = String(contractId);
            if (!milestonesByContract.has(key)) milestonesByContract.set(key, []);
            milestonesByContract.get(key).push(m);
        });

        return contracts
            .filter((c) => {
                const contractId = String(c?.id || '');
                const contractMilestones = milestonesByContract.get(contractId) || [];
                if (contractMilestones.length === 0) return false;

                if (lower) {
                    const contractCode = (c.contractCode || '').toString().toLowerCase();
                    const customerName = (c.customer?.name || '').toString().toLowerCase();
                    if (!contractCode.includes(lower) && !customerName.includes(lower)) return false;
                }

                if (debtStatusFilter === 'ALL') return true;

                const hasDebt = contractMilestones.some((m) => {
                    const amount = Number(m?.amount || 0);
                    const paid = paidByMilestoneId.get(String(m?.id)) || 0;
                    const remaining = Math.max(0, amount - paid);
                    return remaining > 0;
                });

                if (debtStatusFilter === 'HAS_DEBT') return hasDebt;
                if (debtStatusFilter === 'NO_DEBT') return !hasDebt;
                return true;
            });
    }, [contracts, milestonesInRange, searchTerm, debtStatusFilter, paidByMilestoneId]);

    const contractIdSet = useMemo(() => new Set(contractsFiltered.map((c) => String(c.id))), [contractsFiltered]);

    const milestonesFiltered = useMemo(() => {
        const filtered = milestonesInRange.filter((m) => {
            const contractId = m.contractId || m.contract?.id;
            if (!contractId) return false;
            return contractIdSet.has(String(contractId));
        });
        return filtered;
    }, [milestonesInRange, contractIdSet]);

    const scheduleMilestones = useMemo(
        () => milestonesFiltered.filter((m) => Boolean(toDateOnly(m?.dueDate))),
        [milestonesFiltered]
    );

    const collectedInPeriod = useMemo(() => {
        const start = effectiveRange?.start;
        const end = effectiveRange?.end;
        let sum = 0;

        debts.forEach((d) => {
            const milestoneId = d?.milestoneId || d?.milestone?.id;
            if (!milestoneId) return;

            const contractId = milestoneToContractId.get(String(milestoneId));
            if (!contractId || !contractIdSet.has(String(contractId))) return;

            d.payments?.forEach((p) => {
                const paymentDate = toDateOnly(p?.paymentDate);
                if (!paymentDate) return;
                if (start && end && !(start <= paymentDate && paymentDate <= end)) return;
                sum += Number(p?.amount || 0);
            });
        });

        return sum;
    }, [debts, effectiveRange, milestoneToContractId, contractIdSet]);

    const stats = useMemo(() => {
        const planned = milestonesFiltered.reduce((sum, m) => sum + Number(m?.amount || 0), 0);
        const pending = milestonesFiltered.reduce((sum, m) => {
            const amount = Number(m?.amount || 0);
            const paid = paidByMilestoneId.get(String(m?.id)) || 0;
            return sum + Math.max(0, amount - paid);
        }, 0);
        const collectionRate = planned > 0 ? clamp((collectedInPeriod / planned) * 100, 0, 100) : 0;
        return { planned, collected: collectedInPeriod, pending, collectionRate, contractsCount: contractsFiltered.length };
    }, [milestonesFiltered, paidByMilestoneId, collectedInPeriod, contractsFiltered.length]);

    const rangeCaption = useMemo(() => {
        if (!effectiveRange) return 'Tất cả thời gian';
        try {
            const start = parseISO(effectiveRange.start);
            const end = parseISO(effectiveRange.end);
            return `${format(start, 'dd/MM', { locale: vi })} → ${format(end, 'dd/MM/yyyy', { locale: vi })}`;
        } catch {
            return 'Tất cả thời gian';
        }
    }, [effectiveRange]);


    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-50/70 border border-indigo-100 text-indigo-600 rounded-xl">
                            <Wallet className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.75} />
                        </div>
                        Quản lý tài chính
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5 ml-1">Theo dõi công nợ, lộ trình thanh toán và dòng tiền hợp đồng</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleRefresh}
                        type="button"
                        disabled={isLoading}
                        aria-label="Tải lại dữ liệu"
                        className={cn(
                            "p-2 bg-white border border-slate-200/80 rounded-xl shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 active:scale-95",
                            isLoading ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-indigo-600 hover:border-indigo-200"
                        )}
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} strokeWidth={1.75} />
                    </button>

                    <div
                        role="tablist"
                        aria-label="Chế độ xem tài chính"
                        className="flex bg-slate-100/70 p-1 rounded-xl border border-slate-200/50 shadow-sm ml-auto md:ml-0"
                        onKeyDown={handleTabsKeyDown}
                    >
                        <button
                            onClick={() => setViewType('list')}
                            type="button"
                            role="tab"
                            id={listTabId}
                            aria-selected={viewType === 'list'}
                            aria-controls={panelId}
                            tabIndex={viewType === 'list' ? 0 : -1}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                                viewType === 'list'
                                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/10"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                            )}
                        >
                            <List className="w-4 h-4" strokeWidth={1.75} />
                            Hợp đồng
                        </button>
                        <button
                            onClick={() => setViewType('schedule')}
                            type="button"
                            role="tab"
                            id={scheduleTabId}
                            aria-selected={viewType === 'schedule'}
                            aria-controls={panelId}
                            tabIndex={viewType === 'schedule' ? 0 : -1}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                                viewType === 'schedule'
                                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/10"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                            )}
                        >
                            <CalendarIcon className="w-4 h-4" strokeWidth={1.75} />
                            Lịch trình
                        </button>
                    </div>
                </div>
            </div>

            <FinanceToolbar
                preset={preset}
                onPresetChange={handlePresetChange}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onRangeStartChange={handleRangeStartChange}
                onRangeEndChange={handleRangeEndChange}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                debtStatusFilter={debtStatusFilter}
                onDebtStatusFilterChange={setDebtStatusFilter}
                onReset={handleReset}
            />

            {/* Summary */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng quan tài chính</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-wider">{rangeCaption}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Planned Card */}
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] p-5 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dự kiến trong kỳ</span>
                            <div className="p-1.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-600">
                                <DollarSign className="w-4 h-4" strokeWidth={1.75} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.planned)}</h3>
                    </div>

                    {/* Collected Card */}
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] p-5 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã thu trong kỳ</span>
                            <div className="p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(stats.collected)}</h3>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                {Math.round(stats.collectionRate)}%
                            </span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full mt-3.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.collectionRate}%` }}></div>
                        </div>
                    </div>

                    {/* Pending Card */}
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] p-5 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Còn phải thu</span>
                            <div className="p-1.5 rounded-lg bg-rose-50/60 border border-rose-100 text-rose-600">
                                <AlertCircle className="w-4 h-4" strokeWidth={1.75} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-rose-600 tracking-tight">{formatCurrency(stats.pending)}</h3>
                    </div>

                    {/* Contracts Card */}
                    <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] p-5 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hợp đồng liên quan</span>
                            <div className="p-1.5 rounded-lg bg-slate-50/60 border border-slate-200/80 text-slate-600">
                                <FileText className="w-4 h-4" strokeWidth={1.75} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                            {stats.contractsCount} <span className="text-xs font-semibold text-slate-400 normal-case">hợp đồng</span>
                        </h3>
                    </div>
                </div>
            </section>

            {/* Main Content View */}
            {isLoading ? (
                <div
                    className="flex flex-col items-center justify-center py-40 gap-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                >
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 text-sm font-medium animate-pulse">Đang tải hợp đồng, công nợ và mốc thanh toán...</p>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    <div role="tabpanel" id={panelId} aria-labelledby={viewType === 'list' ? listTabId : scheduleTabId}>
                        {contractsFiltered.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-sm">
                                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                    <FileText className="w-7 h-7" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-base font-semibold text-slate-800 mb-1">Không có dữ liệu phù hợp</h3>
                                <p className="text-slate-400 text-sm font-normal">Vui lòng thay đổi khoảng thời gian hoặc bộ lọc tìm kiếm.</p>
                            </div>
                        ) : viewType === 'list' ? (
                            <ContractDebtList contracts={contractsFiltered} debts={debts} milestones={milestonesFiltered} />
                        ) : scheduleMilestones.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-sm">
                                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                    <CalendarIcon className="w-7 h-7" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-base font-semibold text-slate-800 mb-1">Không có mốc thanh toán</h3>
                                <p className="text-slate-400 text-sm font-normal">Không tìm thấy mốc thanh toán nào trong khoảng thời gian đã chọn.</p>
                            </div>
                        ) : (
                            <FinanceSchedule
                                contracts={contractsFiltered}
                                debts={debts}
                                milestones={scheduleMilestones}
                                rangeStart={effectiveRange?.start}
                                rangeEnd={effectiveRange?.end}
                                rangeCaption={rangeCaption}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
