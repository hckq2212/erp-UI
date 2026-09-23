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
  Percent,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import {
  useGetPaymentMilestonesByContractQuery
} from '../../../api/paymentMilestones';
import {
  useGetDebtsByContractQuery,
  useUnlockDebtMutation
} from '../../../api/debts';
import { Button } from '../../../components/ui/Button';
import { MilestoneModal } from '../../../components/finance/MilestoneModal';
import { DebtDetailsModal } from '../../../components/finance/DebtDetailsModal';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/authSlice';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/format';
import { canUnlockDebt } from '../../../utils/projectPause';

export const FinancialInfo = ({ contract }) => {
  const contractId = contract.id;
  const currentUser = useSelector(selectCurrentUser);

  // Queries
  const { data: milestones, isLoading: loadingMilestones } = useGetPaymentMilestonesByContractQuery(contractId);
  const { data: rawDebts, isLoading: loadingDebts } = useGetDebtsByContractQuery(contractId);
  const [unlockDebt, { isLoading: isUnlocking }] = useUnlockDebtMutation();

  // // Mutations
  // const [activateDebt] = useActivateDebtMutation();

  // Modal states
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isDebtDetailsModalOpen, setIsDebtDetailsModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [unlockReason, setUnlockReason] = useState('');

  const handleUnlock = async () => {
    if (!unlockReason.trim()) {
      toast.error('Vui lòng nhập lý do mở khóa công nợ');
      return;
    }
    try {
      await unlockDebt({ id: unlockTarget.id, reason: unlockReason.trim() }).unwrap();
      toast.success('Đã mở khóa công nợ');
      setUnlockTarget(null);
      setUnlockReason('');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể mở khóa công nợ');
    }
  };

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
    setSelectedDebt(debt);
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Premium Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg shadow-blue-100 text-white relative overflow-hidden group flex justify-around flex-col">
          <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tổng giá trị hợp đồng</p>
          <div className="text-xl font-black">{formatCurrency(sellingPrice)}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-green-200 transition-all">
          <div className='flex flex-col justify-between items-start  h-[100%]'>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Tổng vốn</p>
            <div className="text-xl font-black text-green-600">{formatCurrency(contract.cost)}</div>
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
            <div className="text-xl font-black text-green-600">{formatCurrency(totalPaid)}</div>
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
            <div className="text-xl font-black text-red-600">{formatCurrency(totalDebt)}</div>
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
              Lộ trình Thanh Toán
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

            {processedMilestones.map((m, idx) => {
              const overdue = m.isActive && !m.isCompleted && m.dueDate && new Date(m.dueDate) < new Date();

              return (
                <div key={m.id} className="relative flex gap-8 group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
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
                          {m.debt?.status === 'LOCKED' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase flex items-center gap-1">
                              <Lock size={9} /> Đã khóa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-300" />
                            Hạn: {formatDate(m.dueDate) || 'N/A'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-200" />
                          <span className="text-gray-600 font-bold">Giá trị: {formatCurrency(m.amount)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto self-end md:self-center">
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
                        {m.debt && (
                          <div className="flex items-center gap-2">
                            {m.debt.status === 'LOCKED' && canUnlockDebt(currentUser) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnlockTarget(m.debt);
                                  setUnlockReason('');
                                }}
                                className="p-2 bg-white text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                                title="Mở khóa công nợ (dự án đã đóng)"
                              >
                                <Unlock size={16} />
                              </button>
                            )}
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

      {/* Modal mở khóa công nợ — chỉ BOD/ADMIN, bắt buộc lý do */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mở khóa công nợ</h3>
                  <p className="text-[11px] text-gray-500 font-medium truncate max-w-[220px]">
                    {unlockTarget.milestone?.name || unlockTarget.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setUnlockTarget(null); setUnlockReason(''); }}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 font-medium">
                Công nợ này đã bị khóa do dự án đã đóng.
                {unlockTarget.lockReason && (
                  <p className="mt-1">Lý do khóa: <b>{unlockTarget.lockReason}</b></p>
                )}
                <p className="mt-1">Mở khóa sẽ đưa khoản nợ về trạng thái thu tiền bình thường và được ghi vết vào lịch sử.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  Lý do mở khóa <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm resize-none"
                  rows="3"
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="Ví dụ: Đóng dự án nhầm, khách vẫn còn nợ cần thu..."
                  autoFocus
                />
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => { setUnlockTarget(null); setUnlockReason(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || !unlockReason.trim()}
                className="flex-1 px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:bg-amber-300 text-sm"
              >
                {isUnlocking ? 'Đang xử lý...' : 'Xác nhận mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
