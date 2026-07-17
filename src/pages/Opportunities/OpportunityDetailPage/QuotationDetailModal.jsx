import { Fragment, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  FileText,
  Paperclip,
  X,
  XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useApproveQuotationMutation,
  useGetQuotationQuery,
  useRejectQuotationMutation
} from '../../../api/quotations';
import { getFilePreviewUrl } from '../../../utils/cloudinary';
import { formatNumber } from '../../../utils/format';

export const QuotationDetailModal = ({
  quotationId,
  isOpen,
  onClose,
  formatDate,
  onEdit,
  opportunity,
  currentUser
}) => {
  const { data: quotation, isLoading, error } = useGetQuotationQuery(quotationId, {
    skip: !isOpen || !quotationId
  });
  const [approveQuotation, { isLoading: isApproving }] = useApproveQuotationMutation();
  const [rejectQuotation, { isLoading: isRejecting }] = useRejectQuotationMutation();

  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedPackages, setExpandedPackages] = useState({});
  const [expandedServices, setExpandedServices] = useState({});

  const roundToTenThousands = (value) => Math.ceil(value / 10000) * 10000;

  const { aggregatedItems, totalWithVat } = useMemo(() => {
    if (!quotation?.details) {
      return { aggregatedItems: { packages: [], standalone: [] }, totalWithVat: 0 };
    }

    const packages = {};
    const standalone = [];
    let runningTotalWithVat = 0;

    quotation.details.forEach((detail) => {
      const sellingPrice = parseFloat(detail.sellingPrice || 0);
      const quantity = detail.quantity || 0;
      const itemRevenue = sellingPrice * quantity;
      const itemVat = Math.round(itemRevenue * 0.08);

      runningTotalWithVat += roundToTenThousands(itemRevenue + itemVat);

      const groupKey = detail.packageName || 'STANDALONE';

      if (groupKey === 'STANDALONE') {
        standalone.push({
          ...detail,
          revenue: itemRevenue,
          vat: itemVat,
          totalWithVat: roundToTenThousands(itemRevenue + itemVat)
        });
        return;
      }

      if (!packages[groupKey]) {
        const pkgQty = detail.packageQuantity || 1;
        packages[groupKey] = {
          name: groupKey,
          quantity: pkgQty,
          sellingPrice: 0,
          costAtSale: 0,
          vat: 0,
          totalWithVat: 0,
          items: []
        };
      }

      const norm = detail.packageQuantity ? quantity / detail.packageQuantity : quantity;

      packages[groupKey].sellingPrice += sellingPrice * norm;
      packages[groupKey].costAtSale += parseFloat(detail.costAtSale || 0) * norm;
      packages[groupKey].vat += itemVat;
      packages[groupKey].totalWithVat += roundToTenThousands(itemRevenue + itemVat);
      packages[groupKey].items.push({
        ...detail,
        norm
      });
    });

    return {
      aggregatedItems: {
        packages: Object.values(packages),
        standalone
      },
      totalWithVat: runningTotalWithVat
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

  const togglePackage = (packageKey) => {
    setExpandedPackages((prev) => ({
      ...prev,
      [packageKey]: !prev[packageKey]
    }));
  };

  const toggleService = (serviceKey) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <FileText className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết báo giá</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-red-500">Có lỗi xảy ra khi tải báo giá</p>
            </div>
          ) : quotation ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-purple-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-white px-3 py-1 font-mono text-sm text-gray-700">
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
                  <div className="mt-3 border-t border-purple-200 pt-3">
                    <p className="mb-1 text-sm font-medium text-gray-700">Ghi chú:</p>
                    <p className="text-sm text-gray-600">{quotation.note}</p>
                  </div>
                )}

                {quotation.status === 'REJECTED' && (
                  <div className="-mx-4 mt-3 rounded-b-xl border-b border-red-100 bg-red-50/50 px-4 pb-3 pt-3 border-t border-red-200">
                    <p className="mb-1 text-sm font-bold uppercase tracking-wider text-red-700">
                      Lý do từ chối:
                    </p>
                    <p className="text-sm italic text-red-600">
                      "{quotation.description || 'Không có lý do chi tiết'}"
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-3 font-semibold text-gray-900">Chi tiết dịch vụ</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dịch vụ</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Số lượng</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Đơn giá</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Giá vốn</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">VAT (8%)</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedItems.packages.map((pkg, pIdx) => {
                        const packageKey = `pkg-${pIdx}-${pkg.name}`;
                        const isPackageExpanded = Boolean(expandedPackages[packageKey]);

                        return (
                          <Fragment key={packageKey}>
                            <tr
                              className="cursor-pointer border-b border-blue-100/50 bg-blue-50/30"
                              onClick={() => togglePackage(packageKey)}
                            >
                              <td className="px-4 py-3 text-sm font-bold text-blue-900">
                                <div className="flex items-center gap-2">
                                  {isPackageExpanded ? (
                                    <ChevronDown className="h-4 w-4 shrink-0 text-blue-700" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 shrink-0 text-blue-700" />
                                  )}
                                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                                    Gói
                                  </span>
                                  {pkg.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1 shadow-sm">
                                  <span className="text-sm font-bold text-blue-900">{pkg.quantity}</span>
                                  <span className="text-[10px] font-black uppercase tracking-tighter text-blue-400">
                                    Gói
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-blue-900">
                                {formatNumber(Math.round(pkg.sellingPrice))}
                              </td>
                              <td className="px-4 py-3 text-right text-sm italic text-blue-700">
                                {formatNumber(Math.round(pkg.costAtSale))}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-blue-900">
                                {formatNumber(pkg.vat)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-black italic text-blue-900">
                                {formatNumber(pkg.totalWithVat)}
                              </td>
                            </tr>

                            {isPackageExpanded &&
                              pkg.items.map((item, iIdx) => {
                                const serviceKey = `${packageKey}-item-${iIdx}`;
                                const isServiceExpanded = Boolean(expandedServices[serviceKey]);
                                const serviceDescription = item.service?.description || item.description;

                                return (
                                  <Fragment key={serviceKey}>
                                    <tr
                                      className="cursor-pointer border-b border-gray-50/50 bg-blue-50/5 hover:bg-blue-50/20"
                                      onClick={() => toggleService(serviceKey)}
                                    >
                                      <td className="px-4 py-2 pl-10 text-sm italic text-gray-500">
                                        <div className="flex items-center gap-2">
                                          {isServiceExpanded ? (
                                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                          )}
                                          <span className="font-medium text-gray-600">
                                            {item.name || item.service?.name || 'N/A'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <div className="flex flex-col items-center">
                                          <span className="text-xs font-bold text-gray-500">
                                            {Number(item.norm) % 1 === 0
                                              ? item.norm
                                              : Number(item.norm).toFixed(2).replace(/\.?0+$/, '')}{' '}
                                            {item.service?.unit || item.unit} / Gói
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-right text-xs font-medium italic text-gray-400">
                                        {formatNumber(Math.round(item.sellingPrice))}
                                      </td>
                                      <td
                                        className="px-4 py-2 text-right text-xs font-medium italic text-gray-400"
                                        colSpan="3"
                                      />
                                    </tr>

                                    {isServiceExpanded && serviceDescription && (
                                      <tr className="border-b border-gray-50/50 bg-blue-50/10">
                                        <td
                                          colSpan={6}
                                          className="px-4 py-3 pl-16 text-[11px] leading-relaxed text-gray-500 whitespace-pre-wrap"
                                        >
                                          {serviceDescription}
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })}
                          </Fragment>
                        );
                      })}

                      {aggregatedItems.standalone.length > 0 && (
                        <>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <td
                              colSpan={6}
                              className="bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
                            >
                              Dịch vụ lẻ
                            </td>
                          </tr>

                          {aggregatedItems.standalone.map((item, idx) => {
                            const serviceKey = `standalone-${idx}`;
                            const isServiceExpanded = Boolean(expandedServices[serviceKey]);
                            const serviceDescription = item.service?.description || item.description;

                            return (
                              <Fragment key={serviceKey}>
                                <tr
                                  className="group cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                                  onClick={() => toggleService(serviceKey)}
                                >
                                  <td className="px-4 py-3 text-sm font-medium italic text-gray-900 transition-colors group-hover:text-purple-700">
                                    <div className="flex items-center gap-2">
                                      {isServiceExpanded ? (
                                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                      )}
                                      <span className="font-bold text-gray-900">
                                        {item.name || item.service?.name || 'N/A'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="rounded-md bg-gray-100 px-2 py-1 text-sm font-bold text-gray-900">
                                      {item.quantity} {item.service?.unit || item.unit}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                                    {formatNumber(Math.round(item.sellingPrice))}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm italic text-gray-500">
                                    {formatNumber(Math.round(item.costAtSale))}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                                    {formatNumber(item.vat)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-black italic text-gray-900">
                                    {formatNumber(item.totalWithVat)}
                                  </td>
                                </tr>

                                {isServiceExpanded && serviceDescription && (
                                  <tr className="border-b border-gray-100 bg-gray-50/70">
                                    <td
                                      colSpan={6}
                                      className="px-4 py-3 pl-10 text-xs leading-relaxed text-gray-500 whitespace-pre-wrap"
                                    >
                                      {serviceDescription}
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="5" className="px-4 py-3 text-right text-sm text-gray-700">
                          Tổng cộng (có VAT):
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-black text-gray-900">
                          {formatNumber(totalWithVat)} VNĐ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-900">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  Brief
                </label>
                <p className="mb-4 text-left text-sm italic text-gray-400">
                  {opportunity.description || 'Không có mô tả'}
                </p>
              </div>

              {opportunity?.attachments?.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                    <Paperclip className="h-4 w-4 text-blue-600" />
                    Tài liệu đính kèm từ cơ hội
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {opportunity.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={getFilePreviewUrl(file.url, file.type)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-all hover:border-blue-200 hover:bg-blue-50"
                      >
                        <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium text-gray-700 group-hover:text-blue-900">
                            {file.name}
                          </p>
                          <p className="text-[10px] font-bold uppercase text-gray-400">
                            Tài liệu cơ hội
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t border-gray-200 pt-4 text-sm text-gray-500">
                <div>
                  <span>Ngày tạo: </span>
                  <span className="font-medium text-gray-700">{formatDate(quotation.createdAt)}</span>
                </div>
                <div>
                  <span>Cập nhật: </span>
                  <span className="font-medium text-gray-700">{formatDate(quotation.updatedAt)}</span>
                </div>
              </div>

              {isRejectingMode && (
                <div className="animate-in slide-in-from-top-2 fade-in rounded-xl border border-red-100 bg-red-50 p-4 duration-300">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-bold uppercase tracking-wide text-red-700">
                      Lý do từ chối
                    </label>
                    <button
                      onClick={() => {
                        setIsRejectingMode(false);
                        setRejectionReason('');
                      }}
                      className="text-red-400 transition-colors hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <textarea
                    rows="4"
                    className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm outline-none transition-all placeholder:text-gray-300 focus:ring-2 focus:ring-red-500"
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

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          {quotation && quotation.status === 'REJECTED' && (
            <button
              onClick={() => onEdit(quotation)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-bold text-white shadow-lg shadow-purple-100 transition-all hover:bg-purple-700 active:scale-95"
            >
              <Edit className="h-5 w-5" />
              Sửa báo giá
            </button>
          )}

          {quotation &&
            (quotation.status === 'DRAFT' || quotation.status === 'PENDING_APPROVAL') &&
            (opportunity?.status === 'PENDING_QUOTE_APPROVAL' ||
              opportunity?.status === 'QUOTATION_DRAFTING' ||
              quotation.type === 'ADDENDUM') &&
            (currentUser.role === 'BOD' || currentUser.role === 'ADMIN') && (
              <>
                {!isRejectingMode && (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-[2] rounded-xl bg-green-600 px-4 py-3 font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {isApproving ? 'Đang duyệt...' : 'Duyệt báo giá'}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className={`${isRejectingMode ? 'w-full' : 'flex-1'} rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5" />
                    {isRejecting
                      ? 'Đang xử lý...'
                      : isRejectingMode
                        ? 'Xác nhận từ chối'
                        : 'Từ chối'}
                  </span>
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};
