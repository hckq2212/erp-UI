import { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings2,
  Trash2
} from 'lucide-react';
import {
  useGetPaymentMilestonesByContractQuery
} from '../../../api/paymentMilestones';
import {
  useGetDebtsQuery,
  useActivateDebtMutation,
  useCreatePaymentMutation,
  useDeletePaymentMutation
} from '../../../api/debts';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { MilestoneModal } from './MilestoneModal';
import { toast } from 'react-toastify';

export const FinancialInfo = ({ contract }) => {
  const contractId = contract.id;

  // Queries
  const { data: milestones, isLoading: loadingMilestones } = useGetPaymentMilestonesByContractQuery(contractId);
  const { data: debts, isLoading: loadingDebts } = useGetDebtsQuery({ contractId });

  // Mutations
  const [activateDebt] = useActivateDebtMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();

  // Modal states
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Payment modal state
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');

  const sellingPrice = Number(contract.sellingPrice || contract.selling_price || 0);

  const handleActivateDebt = async (milestoneId) => {
    try {
      await activateDebt({ milestoneId }).unwrap();
      toast.success('Đã kích hoạt công nợ cho đợt thanh toán này');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể kích hoạt công nợ');
    }
  };

  const openPaymentModal = (debt) => {
    const remaining = debt.amount - (debt.paidAmount || 0);
    setSelectedDebt(debt);
    setPaymentAmount(remaining.toString()); // Suggest remaining amount
    setIsPaymentModalOpen(true);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await createPayment({
        debtId: selectedDebt.id,
        amount: Number(paymentAmount),
        paymentDate,
        note: paymentNote
      }).unwrap();
      toast.success('Ghi nhận thanh toán thành công');
      setIsPaymentModalOpen(false);
      setPaymentNote('');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể ghi nhận thanh toán');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch sử thanh toán này?')) return;
    try {
      await deletePayment(paymentId).unwrap();
      toast.success('Đã xóa ghi nhận thanh toán');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể xóa thanh toán');
    }
  };

  if (loadingMilestones || loadingDebts) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng giá trị</label>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {sellingPrice.toLocaleString('vi-VN')} <span className="text-sm font-normal text-gray-500">VNĐ</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã thanh toán</label>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {(debts?.reduce((sum, d) => sum + (d.paidAmount || 0), 0) || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-gray-500">VNĐ</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Còn nợ</label>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {(debts?.reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0) || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal text-gray-500">VNĐ</span>
          </div>
        </div>
      </div>

      {/* Payment Milestones Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Lộ trình thanh toán
          </h2>
          <Button size="sm" onClick={() => setIsMilestoneModalOpen(true)} variant="outline" className="flex items-center gap-1.5 h-8">
            <Settings2 className="w-3.5 h-3.5" /> Quản lý lộ trình
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên đợt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {milestones?.map((milestone, idx) => {
                const isActivated = debts?.some(d => d.milestoneId === milestone.id);
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {milestone.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {milestone.percentage}%
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {Number(milestone.amount).toLocaleString('vi-VN')} VNĐ
                    </td>
                    <td className="px-6 py-4">
                      {isActivated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-tight">
                          <CheckCircle2 className="w-3 h-3" /> Đã trả/Nợ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-tight">
                          <Clock className="w-3 h-3" /> Chờ kích hoạt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isActivated && milestone.id && (
                        <button
                          onClick={() => handleActivateDebt(milestone.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Kích hoạt nợ
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!milestones || milestones.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500 text-sm italic">
                    Chưa có kế hoạch thanh toán nào. Nhấn "Quản lý kế hoạch" để thiết lập.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debts & Payments Section */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 px-1">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          Danh sách công nợ & Thanh toán
        </h2>

        {debts?.map((debt) => (
          <div key={debt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{debt.milestone?.name || 'Khoản nợ'}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="text-xs text-gray-500">
                    Giá trị: <span className="font-semibold text-gray-900">{debt.amount.toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Đã trả: <span className="font-semibold text-green-600">{(debt.paidAmount || 0).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Còn lại: <span className="font-semibold text-red-600">{(debt.amount - (debt.paidAmount || 0)).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openPaymentModal(debt)}
                disabled={debt.amount <= (debt.paidAmount || 0)}
                className="h-8 text-xs font-bold"
              >
                Ghi nhận thanh toán
              </Button>
            </div>

            {/* Payments List for this debt */}
            <div className="divide-y divide-gray-50">
              {debt.payments?.map((payment) => (
                <div key={payment.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {payment.amount.toLocaleString('vi-VN')} VNĐ
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {new Date(payment.paymentDate).toLocaleDateString('vi-VN')} {payment.note && `• ${payment.note}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePayment(payment.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!debt.payments || debt.payments.length === 0) && (
                <div className="px-4 py-6 text-center text-xs text-gray-400 italic">
                  Chưa có lịch sử thanh toán cho khoản nợ này.
                </div>
              )}
            </div>
          </div>
        ))}

        {(!debts || debts.length === 0) && (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Chưa có công nợ nào được kích hoạt.</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Ghi nhận thanh toán - ${selectedDebt?.milestone?.name || ''}`}
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền thanh toán
            </label>
            <div className="relative">
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                VNĐ
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              * Hệ thống gợi ý số tiền còn nợ: <span className="text-blue-600 font-semibold">{(selectedDebt ? selectedDebt.amount - (selectedDebt.paidAmount || 0) : 0).toLocaleString('vi-VN')} VNĐ</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày thanh toán
            </label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm min-h-[80px]"
              placeholder="Nhập ghi chú thanh toán..."
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Xác nhận thanh toán
            </Button>
          </div>
        </form>
      </Modal>

      {/* Milestone Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestones={milestones}
        contractId={contractId}
        sellingPrice={sellingPrice}
      />
    </div>
  );
};
