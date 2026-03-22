import { useState, useMemo, Fragment } from 'react';
import { X, FileText, ArrowLeft, Edit, CheckCircle, XCircle, Paperclip, Briefcase } from 'lucide-react';
import { useGetQuotationQuery, useApproveQuotationMutation, useRejectQuotationMutation } from '../../../api/quotations';
import { formatNumber } from '../../../utils/format';
import { toast } from 'react-toastify';
import { getFilePreviewUrl } from '../../../utils/cloudinary';

export const QuotationDetailModal = ({ quotationId, isOpen, onClose, formatDate, onEdit, opportunity, currentUser }) => {
  const { data: quotation, isLoading, error } = useGetQuotationQuery(quotationId, {
    skip: !isOpen || !quotationId
  });
  const [approveQuotation, { isLoading: isApproving }] = useApproveQuotationMutation();
  const [rejectQuotation, { isLoading: isRejecting }] = useRejectQuotationMutation();

  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const aggregatedItems = useMemo(() => {
    if (!quotation?.details) return { packages: [], standalone: [] };

    const packages = {};
    const standalone = [];

    quotation.details.forEach((detail) => {
      const groupKey = detail.packageName || 'STANDALONE';
      if (groupKey === 'STANDALONE') {
        standalone.push(detail);
      } else {
        if (!packages[groupKey]) {
          const pkgQty = detail.packageQuantity || 1;
          packages[groupKey] = {
            name: groupKey,
            quantity: pkgQty,
            sellingPrice: 0,
            costAtSale: 0,
            items: []
          };
        }
        // These prices are per 1 unit of the service within the package
        // We accumulate them to get the unit price of the WHOLE PACKAGE
        packages[groupKey].sellingPrice += parseFloat(detail.sellingPrice || 0);
        packages[groupKey].costAtSale += parseFloat(detail.costAtSale || 0);

        // Calculate norm: total quantity / package quantity
        const norm = detail.packageQuantity ? (detail.quantity / detail.packageQuantity) : detail.quantity;
        packages[groupKey].items.push({
          ...detail,
          norm: norm
        });
      }
    });

    const packageServiceIds = new Set();
    Object.values(packages).forEach(pkg => {
      pkg.items.forEach(item => {
        if (item.service?.id) packageServiceIds.add(String(item.service.id));
        if (item.serviceId) packageServiceIds.add(String(item.serviceId));
      });
    });

    return {
      packages: Object.values(packages),
      standalone: standalone.filter(s => {
        const sId = s.service?.id || s.serviceId;
        return !packageServiceIds.has(String(sId));
      })
    };
  }, [quotation?.details]);

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
                      {/* Render Packages */}
                      {aggregatedItems.packages.map((pkg, pIdx) => {
                        const total = parseFloat(pkg.sellingPrice) * pkg.quantity;
                        const cost = parseFloat(pkg.costAtSale) * pkg.quantity;
                        const profit = total - cost;
                        const profitMargin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;

                        return (
                          <Fragment key={`pkg-${pIdx}`}>
                            <tr className="bg-blue-50/30 border-b border-blue-100/50 group">
                              <td className="px-4 py-3 text-sm font-bold text-blue-900">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase shadow-sm">Gói</span>
                                  {pkg.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded-lg shadow-sm">
                                  <span className="text-sm font-bold text-blue-900">{pkg.quantity}</span>
                                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Gói</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-blue-900">
                                {formatNumber(pkg.sellingPrice)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-blue-700 italic">
                                {formatNumber(pkg.costAtSale)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-black text-blue-900 italic">
                                {formatNumber(total)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                <div className="flex flex-col items-end">
                                  <span className="font-black text-blue-600 text-base">
                                    {profitMargin}%
                                  </span>
                                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-tighter">Lợi nhuận</span>
                                </div>
                              </td>
                            </tr>
                            {/* Package Items */}
                            {pkg.items.map((item, iIdx) => (
                              <tr key={`pkg-${pIdx}-item-${iIdx}`} className="border-b border-gray-50/50 bg-blue-50/5">
                                <td className="px-4 py-2 text-sm text-gray-500 pl-10 italic">
                                  • {item.name || item.service?.name || 'N/A'}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">SL</span>
                                    <span className="text-xs font-bold text-gray-500">{Number(item.norm) % 1 === 0 ? item.norm : Number(item.norm).toFixed(2).replace(/\.?0+$/, '')} {item.service?.unit || item.unit} / Gói</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right text-xs text-gray-400 font-medium italic">
                                  {formatNumber(item.sellingPrice)}
                                </td>
                                <td colSpan={3} className="px-4 py-2 text-right text-[10px] text-gray-300 font-bold uppercase tracking-tight italic">
                                  Đơn giá: {formatNumber(item.sellingPrice)} | Vốn: {formatNumber(item.costAtSale)}
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}

                      {/* Render Standalone Services */}
                      {aggregatedItems.standalone.length > 0 && (
                        <>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <td colSpan={6} className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">
                              Dịch vụ lẻ
                            </td>
                          </tr>
                          {aggregatedItems.standalone.map((item, idx) => {
                            const total = parseFloat(item.sellingPrice) * item.quantity;
                            const cost = parseFloat(item.costAtSale) * item.quantity;
                            const profit = total - cost;
                            const profitMargin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;

                            return (
                              <tr key={`standalone-${idx}`} className="border-b border-gray-100 hover:bg-gray-50 group">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium italic group-hover:text-purple-700 transition-colors">
                                  {item.name || item.service?.name || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{item.quantity} {item.service?.unit || item.unit}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                  {formatNumber(item.sellingPrice)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-500 italic">
                                  {formatNumber(item.costAtSale)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-black text-gray-900 italic">
                                  {formatNumber(total)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                  <div className="flex flex-col items-end">
                                    <span className="font-bold text-purple-600">
                                      {profitMargin}%
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Lợi nhuận</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      )}
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
              <div>
                <label className="font-medium text-gray-900 flex items-center gap-2 font-semibold">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Brief
                </label>
                <p className="text-sm text-gray-400 italic text-left mb-4">
                  {opportunity.description || 'Không có mô tả'}
                </p>
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
                        href={getFilePreviewUrl(file.url, file.type)}
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
          {quotation && quotation.status === 'DRAFT' && (opportunity?.status === 'PENDING_QUOTE_APPROVAL' || opportunity?.status === 'QUOTATION_DRAFTING' || quotation.type === 'ADDENDUM') && (currentUser.role === 'BOD' || currentUser.role === 'ADMIN') && (
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
