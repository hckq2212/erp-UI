import { useState } from 'react';
import {
  DollarSign,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings2,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  useGetPaymentMilestonesByContractQuery
} from '../../../api/paymentMilestones';
import {
  useGetDebtsByContractQuery,
  useActivateDebtMutation
} from '../../../api/debts';
import { Button } from '../../../components/ui/Button';
import { MilestoneModal } from './MilestoneModal';
import { DebtDetailsModal } from '../../../components/finance/DebtDetailsModal';
import { toast } from 'react-toastify';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/format';

export const FinancialInfo = ({ contract }) => {
  const contractId = contract.id;

  // Queries
  const { data: milestones, isLoading: loadingMilestones } = useGetPaymentMilestonesByContractQuery(contractId);
  const { data: rawDebts, isLoading: loadingDebts } = useGetDebtsByContractQuery(contractId);

  // Mutations
  const [activateDebt] = useActivateDebtMutation();

  // Modal states
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isDebtDetailsModalOpen, setIsDebtDetailsModalOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState(null);

  const sellingPrice = Number(contract.sellingPrice || contract.selling_price || 0);

  // Unified Data Processing
  const processedMilestones = milestones?.map(m => {
    // Find debt associated with this milestone
    const debt = rawDebts?.find(d => d.milestone?.id === m.id || d.milestoneId === m.id);

    let paidAmount = 0;
    let payments = [];
    if (debt) {
      payments = debt.payments?.map(p => ({
        ...p,
        amount: Number(p.amount || 0)
      })) || [];
      paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    }

    const amount = Number(m.amount || 0);
    const isCompleted = debt && paidAmount >= amount;
    const isActive = !!debt;
    const remaining = Math.max(0, amount - paidAmount);

    return {
      ...m,
      amount,
      debt,
      payments,
      paidAmount,
      remaining,
      isCompleted,
      isActive
    };
  }) || [];

  const totalPaid = processedMilestones.reduce((sum, m) => sum + m.paidAmount, 0);
  const totalDebt = processedMilestones.reduce((sum, m) => sum + (m.isActive ? m.remaining : 0), 0);
  const progressPercent = sellingPrice > 0 ? Math.round((totalPaid / sellingPrice) * 100) : 0;

  const handleActivateDebt = async (milestoneId) => {
    try {
      await activateDebt({ milestoneId }).unwrap();
      toast.success('Đã kích hoạt công nợ cho đợt thanh toán này');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể kích hoạt công nợ');
    }
  };

  const openDebtDetails = (debt) => {
    setSelectedDebtId(debt.id);
    setIsDebtDetailsModalOpen(true);
  };

  if (loadingMilestones || loadingDebts) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-gray-100 rounded-2xl" />
        <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const selectedDebt = rawDebts?.find(d => d.id === selectedDebtId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Premium Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg shadow-blue-100 text-white relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign size={120} />
          </div>
          <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tổng giá trị hợp đồng</p>
          <div className="text-3xl font-black">{formatCurrency(sellingPrice)}</div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[10px] font-bold">{progressPercent}%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-green-200 transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Đã thanh toán thực tế</p>
              <div className="p-2 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-green-600">{formatCurrency(totalPaid)}</div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Bạn đã thu về {progressPercent}% doanh thu</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-red-200 transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Công nợ chờ thu hồi</p>
              <div className="p-2 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-red-600">{formatCurrency(totalDebt)}</div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Tổng nợ từ các đợt đã kích hoạt</p>
        </div>
      </div>

      {/* Payment Journey Timeline */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Hành Trình Thanh Toán
            </h2>
            <p className="text-sm text-gray-500 font-medium">Theo dõi tiến độ từ lập kế hoạch đến khi thanh toán đủ</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMilestoneModalOpen(true)}
            className="rounded-xl border-gray-200 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm h-10 px-4"
          >
            <Settings2 className="w-4 h-4 mr-2" /> Quản lý lộ trình
          </Button>
        </div>

        <div className="p-8">
          <div className="relative space-y-12">
            {/* Vertical Journey Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-100 to-transparent" />

            {processedMilestones.map((m, idx) => {
              const overdue = m.isActive && !m.isCompleted && m.dueDate && new Date(m.dueDate) < new Date();

              return (
                <div key={m.id} className="relative flex gap-8 group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  {/* Timeline Icon Node */}
                  <div className={cn(
                    "relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border-2",
                    m.isCompleted ? "bg-green-600 border-green-500 text-white shadow-green-100" :
                      m.isActive ? "bg-white border-indigo-600 text-indigo-600 shadow-indigo-100" :
                        "bg-white border-gray-100 text-gray-300"
                  )}>
                    {m.isCompleted ? <CheckCircle2 size={24} /> :
                      m.isActive ? <CreditCard size={24} className={cn(overdue && "animate-pulse text-red-500")} /> :
                        <Clock size={24} />}

                    {/* Step Number Badge */}
                    <div className={cn(
                      "absolute -top-2 -right-2 w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center border-2 border-white",
                      m.isActive || m.isCompleted ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-400"
                    )}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={cn(
                    "flex-1 p-6 rounded-2xl border transition-all duration-300",
                    m.isActive ? "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-100" : "bg-gray-50/30 border-dashed border-gray-200 opacity-70"
                  )}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-black text-gray-900 uppercase tracking-tight">{m.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 flex items-center gap-1">
                            <Percent size={10} /> {m.percentage}%
                          </span>
                          {overdue && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase animate-bounce">
                              Quá hạn nộp
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-300" />
                            Hạn: {m.dueDate ? new Date(m.dueDate).toLocaleDateString('vi-VN') : 'N/A'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-200" />
                          <span className="text-gray-600 font-bold">Giá trị: {formatCurrency(m.amount)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-center">
                        {!m.isActive ? (
                          <Button
                            onClick={() => handleActivateDebt(m.id)}
                            variant="primary"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 font-black px-6 h-9"
                          >
                            <PlusCircle className="w-4 h-4 mr-2" /> Kích hoạt nợ
                          </Button>
                        ) : (
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="text-right hidden sm:block">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Đã thu</p>
                              <p className="text-sm font-black text-green-600">{formatCurrency(m.paidAmount)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Còn nợ</p>
                              <p className={cn(
                                "text-sm font-black",
                                m.remaining > 0 ? "text-red-500" : "text-green-600"
                              )}>{formatCurrency(m.remaining)}</p>
                            </div>
                            <button
                              onClick={() => openDebtDetails(m.debt)}
                              className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:translate-x-1"
                            >
                              <ArrowRight size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Line for Active items */}
                    {m.isActive && (
                      <div className="mt-5 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tiến độ thu tiền đợt này</span>
                          <span className={cn(
                            "text-[10px] font-black",
                            m.isCompleted ? "text-green-600" : "text-indigo-600"
                          )}>{Math.round((m.paidAmount / m.amount) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100/50">
                          <div
                            className={cn(
                              "h-full transition-all duration-[1500ms] ease-out",
                              m.isCompleted ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-blue-500"
                            )}
                            style={{ width: `${Math.min(100, (m.paidAmount / m.amount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {processedMilestones.length === 0 && (
              <div className="py-24 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/20">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-50 flex items-center justify-center mb-6">
                  <Calendar className="w-10 h-10 text-gray-200" />
                </div>
                <h4 className="text-gray-900 font-black mb-1">Chưa có lộ trình thanh toán</h4>
                <p className="text-gray-400 text-sm font-medium italic mb-6">Vui lòng thiết lập để quản lý hành trình thu hồi vốn.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsMilestoneModalOpen(true)}
                  className="bg-indigo-600 rounded-xl font-bold px-8 h-10"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Tạo lộ trình ngay
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200" />
            <span>Đã hoàn tất</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-md border-2 border-indigo-600" />
            <span>Đang thu nợ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span>Đang chờ</span>
          </div>
        </div>
        <p>Mã Hợp Đồng: {contract.contractCode || `#${contract.id}`}</p>
      </div>

      {/* Modals */}
      {selectedDebt && (
        <DebtDetailsModal
          isOpen={isDebtDetailsModalOpen}
          onClose={() => setIsDebtDetailsModalOpen(false)}
          debt={selectedDebt}
          allDebts={rawDebts}
        />
      )}

      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestones={milestones || []}
        contractId={contractId}
        sellingPrice={sellingPrice}
      />
    </div>
  );
};
