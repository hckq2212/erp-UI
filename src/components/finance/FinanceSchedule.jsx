import { useState, useMemo, useRef, useEffect } from 'react';
import {
    format,
    addDays,
    eachDayOfInterval,
    isSameDay,
    isToday,
    startOfWeek,
    differenceInDays,
    parseISO,
    startOfDay,
    endOfDay
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, User, Calendar as CalendarIcon, DollarSign, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { DebtDetailsModal } from './DebtDetailsModal';

export const FinanceSchedule = ({ contracts = [], debts = [], milestones = [] }) => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const scrollRef = useRef(null);

    // Generate 4 weeks of days
    const days = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({
            start,
            end: addDays(start, 6) // 1 week
        });
    }, [currentDate]);

    // Group milestones by contractId and merge with debt/payment info
    const contractsWithMilestones = useMemo(() => {
        const grouped = {};
        contracts.forEach(c => {
            grouped[c.id] = { ...c, milestones: [] };
        });

        milestones.forEach(m => {
            const contractId = m.contractId || m.contract?.id;
            if (grouped[contractId]) {
                const debt = debts.find(d => d.milestoneId === m.id || d.milestone?.id === m.id);
                const amount = Number(m.amount || 0);

                let paidAmount = 0;
                let payments = [];

                if (debt) {
                    payments = debt.payments?.map(p => ({
                        ...p,
                        amount: Number(p.amount || 0)
                    })) || [];
                    paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
                }

                grouped[contractId].milestones.push({
                    ...m,
                    debt,
                    payments,
                    paidAmount
                });
            }
        });

        // Only return contracts that have at least one milestone
        return Object.values(grouped).filter(c => c.milestones.length > 0);
    }, [contracts, debts, milestones]);

    // Simplified scroll to today for better initial positioning if needed, 
    // but in 1-week view, today is usually already visible.
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = 0;
        }
    }, [days]);

    const handlePrev = () => setCurrentDate(prev => addDays(prev, -7));
    const handleNext = () => setCurrentDate(prev => addDays(prev, 7));

    const getMilestonePosition = (milestone, daysInterval) => {
        if (!milestone.dueDate) return null;

        const dueDate = parseISO(milestone.dueDate);
        const viewStart = startOfDay(daysInterval[0]);
        const viewEnd = endOfDay(daysInterval[daysInterval.length - 1]);

        if (dueDate < viewStart || dueDate > viewEnd) return null;

        const leftOffset = differenceInDays(dueDate, viewStart);
        return {
            left: `${leftOffset * 140}px`, // 140 is day width
            width: '140px'
        };
    };

    const openDebtDetails = (debt) => {
        setSelectedDebt(debt);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-20">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-indigo-600" />
                        Lịch Thanh Toán Hợp Đồng
                    </h3>
                    <span className="text-sm text-gray-500 font-medium px-3 py-1 bg-gray-50 rounded-lg">
                        {format(days[0], 'dd/MM')} - {format(days[days.length - 1], 'dd/MM/yyyy')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                        Hôm nay
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all">
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all">
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 overflow-auto bg-gray-50/50" ref={scrollRef}>
                <div className="inline-flex min-w-full flex-col relative">

                    {/* Sticky Header Days */}
                    <div className="sticky top-0 z-10 flex bg-white border-b border-gray-200">
                        <div className="w-72 flex-shrink-0 p-4 font-bold text-xs text-gray-400 uppercase tracking-wider border-r border-gray-100 bg-white">
                            Hợp đồng / Khách hàng
                        </div>
                        {days.map((day) => (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "w-[140px] flex-shrink-0 p-3 text-center border-r border-gray-100",
                                    isToday(day) && "bg-blue-50/50"
                                )}
                            >
                                <div className={cn(
                                    "text-[10px] font-bold uppercase",
                                    isToday(day) ? "text-blue-600" : "text-gray-400"
                                )}>
                                    {format(day, 'EEE', { locale: vi })}
                                </div>
                                <div className={cn(
                                    "text-sm font-black mt-0.5 h-7 w-7 flex items-center justify-center mx-auto rounded-full",
                                    isToday(day) ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-gray-700"
                                )}>
                                    {format(day, 'dd')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Content Rows */}
                    <div className="relative">
                        {/* Content Rows */}
                        <div className="relative">
                            {contractsWithMilestones.map((contract) => (
                                <div key={contract.id} className="flex border-b border-gray-100 group hover:bg-white transition-colors relative min-h-[90px]">
                                    {/* Sidebar Contract Info */}
                                    <div
                                        className="w-72 flex-shrink-0 p-4 border-r border-gray-100 bg-white group-hover:bg-indigo-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/contracts/${contract.id}`)}
                                    >
                                        <div className="text-[10px] font-mono text-indigo-600 font-bold mb-1 truncate">
                                            {contract.contractCode || `#${contract.id}`}
                                        </div>
                                        <div className="text-xs font-bold text-gray-900 truncate leading-relaxed">
                                            {contract.customer?.name || 'Khách lẻ'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Còn nợ:</span>
                                            <span className="text-xs font-bold text-red-500">
                                                {formatCurrency(contract.milestones?.reduce((sum, m) => sum + (m.amount - m.paidAmount), 0))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timeline Row with Milestone Markers */}
                                    <div className="flex relative items-center h-full bg-transparent pt-10">
                                        {/* Visual Grid */}
                                        {days.map((day) => (
                                            <div
                                                key={day.toString()}
                                                className={cn(
                                                    "w-[140px] h-full flex-shrink-0 border-r border-gray-100/50 pointer-events-none",
                                                    isToday(day) && "bg-blue-50/10"
                                                )}
                                            />
                                        ))}

                                        {/* Milestone Markers (Bars) */}
                                        {contract.milestones.map((m) => {
                                            const pos = getMilestonePosition(m, days);
                                            if (!pos) return null;
                                            const isPaid = m.debt && m.paidAmount >= m.amount;

                                            return (
                                                <div
                                                    key={m.id}
                                                    className={cn(
                                                        "absolute h-10 flex flex-col justify-center px-3 transition-all z-10 shadow-sm border-l-4",
                                                        !m.debt ? "bg-gray-100 border-gray-300 text-gray-500 opacity-60" :
                                                            isPaid
                                                                ? "bg-green-50 border-green-500 text-green-700 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                                                : "bg-orange-50 border-orange-500 text-orange-700 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                                    )}
                                                    style={{
                                                        left: pos.left,
                                                        width: pos.width,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)'
                                                    }}
                                                    onClick={() => m.debt && openDebtDetails(m.debt)}
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden w-full">
                                                        <div className={cn(
                                                            "p-1 rounded-full",
                                                            !m.debt ? "bg-gray-200" : isPaid ? "bg-green-100" : "bg-orange-100"
                                                        )}>
                                                            {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-black uppercase tracking-tight truncate leading-tight">
                                                                {m.name}
                                                            </div>
                                                            <div className="text-[11px] font-bold truncate">
                                                                {formatCurrency(m.amount)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {contractsWithMilestones.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-40 text-gray-400 bg-white min-w-full">
                                    <DollarSign className="w-12 h-12 text-gray-100 mb-4" />
                                    <p className="font-medium italic">Không có mốc thanh toán nào trong khoảng thời gian này</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Legend */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest overflow-x-auto whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-white border-2 border-orange-200 shadow-sm" />
                    <span>Cần thanh toán</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-green-50 border-2 border-green-200 shadow-sm" />
                    <span>Đã hoàn tất</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>Hôm nay</span>
                </div>
            </div>

            <DebtDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                debt={selectedDebt}
                allDebts={debts}
            />
        </div>
    );
};
