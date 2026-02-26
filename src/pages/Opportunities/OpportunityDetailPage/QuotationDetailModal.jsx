import { useState } from 'react';
import { X, FileText, ArrowLeft, Edit, CheckCircle, XCircle, Paperclip } from 'lucide-react';
import { useGetQuotationQuery, useApproveQuotationMutation, useRejectQuotationMutation } from '../../../api/quotations';
import { formatNumber } from '../../../utils/format';
import { toast } from 'react-toastify';

export const QuotationDetailModal = ({ quotationId, isOpen, onClose, formatDate, onEdit, opportunity }) => {
  const { data: quotation, isLoading, error } = useGetQuotationQuery(quotationId, {
    skip: !isOpen || !quotationId
  });
  const [approveQuotation, { isLoading: isApproving }] = useApproveQuotationMutation();
  const [rejectQuotation, { isLoading: isRejecting }] = useRejectQuotationMutation();

  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    if (!quotationId) return;
    try {
      await approveQuotation(quotationId).unwrap();
      toast.success('Đã duyệt báo giá thành công');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi duyệt báo giá');
    }
  };

  const handleReject = async () => {
    if (!quotationId) return;

    if (!isRejectingMode) {
      setIsRejectingMode(true);
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await rejectQuotation({ id: quotationId, description: rejectionReason }).unwrap();
      toast.success('Đã từ chối báo giá');
      setIsRejectingMode(false);
      setRejectionReason('');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi từ chối báo giá');
    }
  };

  if (!isOpen) return null;

  const getStatusLabel = (status) => {
    const labels = {
      'DRAFT': 'Nháp',
      'SENT': 'Đã gửi',
      'APPROVED': 'Đã duyệt',
      'REJECTED': 'Từ chối'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-700',
      'SENT': 'bg-blue-100 text-blue-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <FileText className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết báo giá</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Có lỗi xảy ra khi tải báo giá</p>
            </div>
          ) : quotation ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-700 bg-white px-3 py-1 rounded-lg">
                      Báo giá lần {quotation.version}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-700">Tổng giá trị</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatNumber(quotation.totalAmount)} VNĐ
                    </p>
                  </div>
                </div>

                {quotation.note && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Ghi chú:</p>
                    <p className="text-sm text-gray-600">{quotation.note}</p>
                  </div>
                )}

                {quotation.status === 'REJECTED' && (
                  <div className="mt-3 pt-3 border-t border-red-200 bg-red-50/50 -mx-4 px-4 pb-3 rounded-b-xl border-b border-red-100">
                    <p className="text-sm font-bold text-red-700 mb-1 uppercase tracking-wider">Lý do từ chối:</p>
                    <p className="text-sm text-red-600 italic">"{quotation.description || 'Không có lý do chi tiết'}"</p>
                  </div>
                )}
              </div>
              {/* Details Table */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Chi tiết dịch vụ</h4>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dịch vụ</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Số lượng</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Đơn giá</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá vốn</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Thành tiền</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Lợi nhuận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.details?.map((detail) => {
                        const total = parseFloat(detail.sellingPrice) * detail.quantity;
                        const cost = parseFloat(detail.costAtSale) * detail.quantity;
                        const profit = total - cost;
                        const profitMargin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;

                        return (
                          <tr key={detail.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {detail.service?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-900">
                              {detail.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              {formatNumber(detail.sellingPrice)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                              {formatNumber(detail.costAtSale)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              {formatNumber(total)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <div className="flex flex-col items-end">
                                <span className="font-medium text-green-600">
                                  {formatNumber(profit)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({profitMargin}%)
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-700">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {formatNumber(quotation.totalAmount)} VNĐ
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {(() => {
                            const totalCost = quotation.details?.reduce((sum, d) =>
                              sum + (parseFloat(d.costAtSale) * d.quantity), 0) || 0;
                            const totalProfit = parseFloat(quotation.totalAmount) - totalCost;
                            const totalMargin = quotation.totalAmount > 0
                              ? ((totalProfit / parseFloat(quotation.totalAmount)) * 100).toFixed(1)
                              : 0;
                            return (
                              <div className="flex flex-col items-end">
                                <span className="font-medium text-green-600">
                                  {formatNumber(totalProfit)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({totalMargin}%)
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Opportunity Attachments */}
              {opportunity?.attachments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    Tài liệu đính kèm từ cơ hội
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {opportunity.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
                      >
                        <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-900">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">
                            Tài liệu cơ hội
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                <div>
                  <span>Ngày tạo: </span>
                  <span className="font-medium text-gray-700">{formatDate(quotation.createdAt)}</span>
                </div>
                <div>
                  <span>Cập nhật: </span>
                  <span className="font-medium text-gray-700">{formatDate(quotation.updatedAt)}</span>
                </div>
              </div>

              {/* Rejection Reason Textarea */}
              {isRejectingMode && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-red-700 uppercase tracking-wide">
                      Lý do từ chối
                    </label>
                    <button
                      onClick={() => {
                        setIsRejectingMode(false);
                        setRejectionReason('');
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    rows="4"
                    className="w-full p-3 bg-white border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-gray-300"
                    placeholder="Vui lòng nhập lý do từ chối báo giá này..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {quotation && quotation.status === 'DRAFT' && (opportunity?.status === 'PENDING_QUOTE_APPROVAL' || quotation.type === 'ADDENDUM') && (
            <>
              {!isRejectingMode && (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-[2] px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isApproving ? 'Đang duyệt...' : 'Duyệt báo giá'}
                </button>
              )}
              <button
                onClick={handleReject}
                disabled={isRejecting}
                className={`${isRejectingMode ? 'w-full' : 'flex-1'} px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50`}
              >
                <XCircle className="w-5 h-5" />
                {isRejecting ? 'Đang xử lý...' : isRejectingMode ? 'Xác nhận từ chối' : 'Từ chối'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
