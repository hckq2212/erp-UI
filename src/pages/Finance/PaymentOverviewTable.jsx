import { Fragment, useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  FileText, Plus, Eye, FileCheck, Receipt, ChevronDown, Check,
  CalendarDays, CheckCircle, CheckCircle2, Clock, X, ShieldCheck, AlertCircle, ArrowUpRight,
  Paperclip
} from 'lucide-react';
import { formatVND, formatDateToDDMMYYYY } from '../../utils/format';
import { CONTRACT_STATUS_LABELS, PROJECT_STATUS_LABELS, QUOTATION_STATUS_LABELS } from '../../utils/enums';
import { StatusBadge as StandardStatusBadge } from '../../components/ui/StatusBadge';

const currency = (value) => formatVND(value);
const paymentLabels = { UNPAID: 'Chưa thanh toán', PARTIAL: 'Thanh toán một phần', PAID: 'Đã thanh toán' };
const debtLabels = { UNPAID: 'Chưa thu', PARTIAL: 'Thu một phần', PAID: 'Đã thu đủ', OVERDUE: 'Quá hạn', LOCKED: 'Đã khóa' };

const StatusBadge = ({ status, domain, children }) => {
  if (domain && status) {
    return <StandardStatusBadge domain={domain} status={status} />;
  }
  const tone = ['APPROVED', 'PAID', 'COMPLETED', 'SIGNED', 'PROPOSAL_APPROVED'].includes(status)
    ? 'bg-positive-light text-positive-strong'
    : ['REJECTED', 'CANCELLED', 'PROPOSAL_REJECTED', 'OVERDUE'].includes(status)
      ? 'bg-negative-light text-negative-strong'
      : ['PARTIAL', 'IN_PROGRESS'].includes(status)
        ? 'bg-pending-light text-pending-strong'
        : 'bg-neutral-light text-neutral-strong';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold leading-tight ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
};

/**
 * Helper chuẩn hóa tên file BBNT hiển thị trong badge
 */
const getBbntFileName = (name) => {
  if (!name) return 'BBNT.pdf';
  let clean = name.trim();
  if (!/\.[a-zA-Z0-9]+$/.test(clean)) {
    clean = `${clean}.pdf`;
  }
  return clean.replace(/\s+/g, '_');
};

/**
 * Helper chuẩn hóa tên file HĐ VAT hiển thị trong badge (#VAT-xxxx.pdf)
 */
const getVatInvoiceName = (name) => {
  if (!name) return '#VAT.pdf';
  let clean = name.trim();
  if (/^\d+$/.test(clean)) {
    clean = `VAT-${clean}`;
  }
  if (!clean.startsWith('#')) {
    clean = `#${clean}`;
  }
  if (!/\.[a-zA-Z0-9]+$/.test(clean)) {
    clean = `${clean}.pdf`;
  }
  return clean.replace(/\s+/g, '_');
};

/**
 * Thẻ hiển thị số lượng và danh sách tài liệu (BBNT hoặc HĐ VAT)
 * Thiết kế chuẩn UI theo ảnh mẫu:
 * - BBNT: Icon CheckCircle xanh ngọc + "X files" + (tên_file.pdf)
 * - HĐ VAT: Icon FileText cam đất + #VAT-xxxx.pdf + tag (+XML)
 */
const DocumentCellPill = ({
  docs = [],
  type = 'acceptance', // 'acceptance' | 'invoice'
  onAdd,
  onPreview
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pillRef = useRef(null);

  const count = docs.length;
  const isAcceptance = type === 'acceptance';

  const hasXml =
    docs.some(
      (d) =>
        d.name?.toLowerCase().includes('xml') ||
        d.fileUrl?.toLowerCase().includes('.xml')
    ) ||
    Boolean(docs[0]?.hasXml) ||
    (count > 1 && !isAcceptance);

  const xmlDoc = docs.find(
    (d) =>
      d.name?.toLowerCase().includes('xml') ||
      d.fileUrl?.toLowerCase().includes('.xml')
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pillRef.current && !pillRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePillClick = (e) => {
    e.stopPropagation();
    if (count === 0) {
      onAdd();
      return;
    }
    if (count === 1) {
      onPreview({ url: docs[0].fileUrl, fileName: docs[0].name });
      return;
    }
    setIsOpen(!isOpen);
  };

  // Trạng thái chưa có file: hiển thị --- giống cột ngày thanh toán, bấm vào vẫn mở modal tải lên
  if (count === 0) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors select-none text-xs font-normal"
        title={`Chưa có ${isAcceptance ? 'BBNT' : 'HĐ VAT'}, bấm để tải lên`}
      >
        ---
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center" ref={pillRef}>
      {isAcceptance ? (
        /* BADGE BBNT: (✓) 2 files (BBNT_final.pdf) */
        <div
          role="button"
          tabIndex={0}
          onClick={handlePillClick}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eff4ff] hover:bg-[#e2ebfc] cursor-pointer transition-colors text-xs select-none shadow-2xs"
          title={
            count === 1
              ? `Xem trước ${docs[0]?.name}`
              : `Danh sách ${count} BBNT (Bấm để xem danh sách)`
          }
        >
          <CheckCircle className="h-4 w-4 text-[#007a5a] shrink-0 stroke-[2.2]" />
          <span className="font-bold text-[#007a5a] whitespace-nowrap">
            {count} {count > 1 ? 'files' : 'file'}
          </span>
          <span
            className="text-slate-600 font-normal max-w-[150px] truncate"
            title={docs[0]?.name}
          >
            ({getBbntFileName(docs[0]?.name)})
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="hidden group-hover:inline-flex p-0.5 rounded text-slate-400 hover:text-[#007a5a] hover:bg-white/80 transition-all ml-0.5"
            title="Tải lên thêm BBNT mới"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        /* BADGE HĐ VAT: (📄) #VAT-8841.pdf [+XML] */
        <div
          role="button"
          tabIndex={0}
          onClick={handlePillClick}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eff4ff] hover:bg-[#e2ebfc] cursor-pointer transition-colors text-xs select-none shadow-2xs"
          title={
            count === 1
              ? `Xem trước ${docs[0]?.name}`
              : `Danh sách ${count} HĐ VAT (Bấm để xem danh sách)`
          }
        >
          <FileText className="h-4 w-4 text-[#b45309] shrink-0" />
          <span
            className="text-slate-700 font-medium max-w-[150px] truncate"
            title={docs[0]?.name}
          >
            {getVatInvoiceName(docs[0]?.name)}
          </span>
          {hasXml && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (xmlDoc) {
                  e.stopPropagation();
                  onPreview({ url: xmlDoc.fileUrl, fileName: xmlDoc.name });
                }
              }}
              className="px-1.5 py-0.25 rounded bg-[#dbeafe] text-[#1e40af] text-[10px] font-semibold tracking-wide hover:bg-blue-200 transition-colors shrink-0"
              title="Tệp dữ liệu XML hóa đơn điện tử"
            >
              +XML
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="hidden group-hover:inline-flex p-0.5 rounded text-slate-400 hover:text-[#b45309] hover:bg-white/80 transition-all ml-0.5"
            title="Tải lên thêm HĐ VAT mới"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Menu thả xuống khi có nhiều hơn 1 tài liệu */}
      {isOpen && count > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl animate-in fade-in zoom-in-95 text-left"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1.5 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isAcceptance ? 'Danh sách BBNT' : 'Danh sách HĐ VAT'} ({count})
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAdd();
              }}
              className="text-[11px] font-semibold text-[#f97316] hover:underline flex items-center gap-0.5"
            >
              <Plus className="h-3 w-3" /> Thêm mới
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {docs.map((doc, idx) => {
              const isDocXml =
                doc.name?.toLowerCase().includes('xml') ||
                doc.fileUrl?.toLowerCase().includes('.xml');
              return (
                <div
                  key={doc.id || idx}
                  onClick={() => {
                    setIsOpen(false);
                    onPreview({ url: doc.fileUrl, fileName: doc.name });
                  }}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#eff4ff] cursor-pointer transition-colors text-xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isAcceptance ? (
                      <CheckCircle className="h-3.5 w-3.5 text-[#007a5a] shrink-0" />
                    ) : isDocXml ? (
                      <span className="px-1 py-0.25 rounded bg-[#dbeafe] text-[#1e40af] text-[9px] font-bold shrink-0">
                        XML
                      </span>
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-[#b45309] shrink-0" />
                    )}
                    <span
                      className="truncate font-medium text-slate-700 group-hover:text-slate-900"
                      title={doc.name}
                    >
                      {isAcceptance
                        ? getBbntFileName(doc.name)
                        : getVatInvoiceName(doc.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        onPreview({ url: doc.fileUrl, fileName: doc.name });
                      }}
                      title="Xem trước"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Modal chi tiết lịch sử thanh toán của từng đợt (Theo chuẩn thiết kế 1.html)
 */
const MilestonePaymentModal = ({
  isOpen,
  onClose,
  milestone,
  row,
  onPreviewDocument
}) => {
  if (!isOpen || !milestone || !row) return null;

  const paid = Number(milestone.paidAmount || 0);
  const remaining = Number(milestone.unpaidAmount || 0);
  const isPaid = remaining <= 0 && paid > 0;
  const payments = milestone.payments || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPaid ? 'bg-emerald-100 text-[#006c49]' : 'bg-[#ffdbca] text-[#9d4300]'
            }`}>
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0b1c30] leading-tight">
                Lịch sử thanh toán — {milestone.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dự án: <span className="font-semibold text-slate-800">{row.projectName || row.contractName}</span> · Mã HĐ: <span className="font-medium text-slate-700">{row.contractCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {/* 3 KPI Summary Cards trong Modal (y hệt 1.html) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Số tiền thực nhận</span>
              <span className={`text-xl font-bold tabular-nums mt-1 ${isPaid ? 'text-[#006c49]' : 'text-slate-900'}`}>
                {currency(paid)}
              </span>
              <div className="mt-2">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Đã nhận đủ 100%
                  </span>
                ) : remaining > 0 && paid > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    Còn {currency(remaining)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold">
                    <Clock className="w-3 h-3" />
                    Chưa thu tiền
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Hạn / Ngày thanh toán</span>
              <span className="text-sm font-bold text-slate-900 mt-1">
                {formatDateToDDMMYYYY(milestone.dueDate) || 'Chưa thiết lập'}
              </span>
              <span className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                Mốc đợt theo kế hoạch
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Giá trị đợt ({milestone.percentage}%)</span>
              <span className="text-xl font-bold tabular-nums text-[#f97316] mt-1">
                {currency(milestone.amount)}
              </span>
              <span className="text-[11px] text-slate-500 mt-2 truncate font-medium">
                {debtLabels[milestone.debtStatus] || 'Chưa phát sinh công nợ'}
              </span>
            </div>
          </div>

          {/* Chi tiết lịch sử các lần chuyển tiền */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lịch sử các lần giao dịch ({payments.length})
              </span>
              {remaining > 0 && (
                <span className="text-xs font-semibold text-[#ea580c]">
                  Còn phải thu: {currency(remaining)}
                </span>
              )}
            </div>

            {payments.length > 0 ? (
              <div className="space-y-2.5">
                {payments.map((payment, paymentIdx) => (
                  <div
                    key={payment.id || paymentIdx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[#006c49] text-xs font-bold">
                          {paymentIdx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          Ngày {formatDateToDDMMYYYY(payment.paymentDate) || 'Chưa có ngày'}
                        </span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-[#006c49]">
                        +{currency(payment.amount)}
                      </span>
                    </div>

                    {payment.note && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-medium">
                        {payment.note}
                      </p>
                    )}

                    {payment.attachments && payment.attachments.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Chứng từ giao dịch / Ủy nhiệm chi:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {payment.attachments.map((att, attIdx) => (
                            <button
                              key={att.url || attIdx}
                              type="button"
                              onClick={() =>
                                onPreviewDocument?.({
                                  url: att.url,
                                  fileName: att.name || `Chứng từ ${attIdx + 1}`
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-44">{att.name || `Chứng từ ${attIdx + 1}`}</span>
                              <Eye className="h-3 w-3 text-slate-400 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
                Chưa ghi nhận lần thanh toán nào cho đợt này.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <ShieldCheck className="h-4 w-4 text-[#006c49]" />
            <span>Dữ liệu kế toán đã đối soát & xác thực nội bộ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-xl bg-slate-200 hover:bg-slate-300 px-4 text-xs font-bold text-slate-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hiển thị Lịch thanh toán dạng Grid Cards chuẩn file 1.html
 */
const MilestoneList = ({ row, onPreviewDocument }) => {
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const milestones = [...(row.milestones || [])].sort((a, b) =>
    String(a.dueDate || '').localeCompare(String(b.dueDate || '')));

  // Thống kê đợt đã thu
  const paidCount = milestones.filter(
    (m) => Number(m.unpaidAmount || 0) <= 0 && Number(m.paidAmount || 0) > 0
  ).length;
  const percentageCompleted = milestones.length
    ? Math.round((paidCount / milestones.length) * 100)
    : 0;

  return (
    <div className="px-5 py-4">
      {/* Modal chi tiết thanh toán của từng đợt */}
      {selectedMilestone && (
        <MilestonePaymentModal
          isOpen={Boolean(selectedMilestone)}
          onClose={() => setSelectedMilestone(null)}
          milestone={selectedMilestone}
          row={row}
          onPreviewDocument={onPreviewDocument}
        />
      )}

      {/* Accordion sub-table header (chuẩn 1.html) */}
      <div className="rounded-xl bg-white p-5 shadow-xs border border-[#e5eeff] flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5eeff]/60 pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff4ff] text-[#006c49]">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-[#0b1c30]">
              Lịch thanh toán — {row.projectName || row.contractName} ({milestones.length} đợt)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#eff4ff] border border-[#dce9ff] text-xs text-[#565e74] font-medium shadow-2xs">
              <span>Tổng kỳ thu:</span>
              <strong className="text-[#0b1c30] tabular-nums font-bold">{currency(row.sellingPrice)}</strong>
              <span>net</span>
              <span className="text-slate-400">·</span>
              <span>(<strong className="text-[#0b1c30] tabular-nums font-bold">{currency(row.totalWithVat)}</strong> có VAT {row.vatRate}%)</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#e5eeff] text-[#006c49] border border-emerald-200/50 text-xs font-semibold">
              Đã thu {paidCount}/{milestones.length} đợt ({percentageCompleted}%)
            </span>
          </div>
        </div>

        {/* 4 Đợt Grid Cards */}
        {milestones.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {milestones.map((item, index) => {
              const paid = Number(item.paidAmount || 0);
              const remaining = Number(item.unpaidAmount || 0);
              const isPaid = remaining <= 0 && paid > 0;
              const payments = item.payments || [];
              const attachmentCount = payments.reduce(
                (sum, p) => sum + (p.attachments?.length || 0),
                0
              );
              const hasFile = attachmentCount > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMilestone(item)}
                  className="p-4 rounded-xl bg-[#eff4ff]/70 hover:bg-[#eff4ff] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-3 group border border-transparent hover:border-[#006c49]/30 shadow-xs"
                >
                  {/* Card Header: Tên đợt + Badge trạng thái chuẩn task style */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-[#0b1c30] group-hover:text-[#006c49] truncate transition-colors">
                        Đợt {index + 1} · {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasFile && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold shadow-2xs"
                          title={`${attachmentCount} tệp chứng từ/UNC đính kèm`}
                        >
                          <FileText className="h-3 w-3 text-blue-600" />
                          <span>{attachmentCount} {attachmentCount > 1 ? 'files' : 'file'}</span>
                        </span>
                      )}
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>ĐÃ THU ĐỦ</span>
                        </span>
                      ) : remaining > 0 && paid > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>MỘT PHẦN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                          <AlertCircle className="h-3 w-3 text-rose-600" />
                          <span>CHƯA THU</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Amount & Due Date */}
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-[#565e74]">
                      {isPaid ? 'Ngày: ' : 'Dự kiến: '}
                      <span className="font-medium text-[#0b1c30]">
                        {formatDateToDDMMYYYY(item.dueDate) || 'Chưa có'}
                      </span>
                    </span>
                    <span className="text-sm font-bold tabular-nums text-[#0b1c30]">
                      {currency(item.amount)}
                    </span>
                  </div>

                  {/* Card Status Footer */}
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-[#dce9ff]/80">
                    {isPaid ? (
                      <span className="text-[#006c49] font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]" />
                        Đã thanh toán đủ
                      </span>
                    ) : remaining > 0 && paid > 0 ? (
                      <span className="text-amber-700 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Còn {currency(remaining)}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Còn {currency(remaining)}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {hasFile && (
                        <span className="text-[11px] text-[#565e74] flex items-center gap-1" title="Có chứng từ/UNC đính kèm">
                          <Paperclip className="h-3 w-3 text-slate-400" />
                          <span>{attachmentCount} UNC</span>
                        </span>
                      )}
                      <span className="text-xs text-[#565e74] font-medium">
                        {item.percentage}% HĐ
                      </span>
                    </div>
                  </div>

                  {/* Nút Xem lịch sử thanh toán */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMilestone(item);
                    }}
                    className="mt-1 w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs bg-white hover:bg-orange-50 hover:border-orange-200 text-[#0b1c30] hover:text-[#9d4300] border border-[#dce9ff]"
                  >
                    <Receipt className="h-3.5 w-3.5 text-[#565e74]" />
                    <span>Xem lịch sử thanh toán</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-[#eff4ff] p-4 text-xs text-[#565e74] text-center">
            Chưa có mốc thanh toán trong năm.
          </p>
        )}

        {/* Tài liệu đính kèm (BBNT & HĐ VAT) ở chân lịch thanh toán */}
        {(row.acceptanceMinutes?.length > 0 || row.vatInvoices?.length > 0) && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Tài liệu đã xuất:</span>
            {row.acceptanceMinutes?.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => onPreviewDocument?.({ url: doc.fileUrl, fileName: doc.name })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-[#006c49] border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>BBNT: {doc.name}</span>
                <Eye className="h-3 w-3 ml-0.5 opacity-60" />
              </button>
            ))}
            {row.vatInvoices?.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => onPreviewDocument?.({ url: doc.fileUrl, fileName: doc.name })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#fff8f4] px-2.5 py-1 text-[11px] font-semibold text-[#ea580c] border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>HĐ VAT: {doc.name}</span>
                <Eye className="h-3 w-3 ml-0.5 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentOverviewRow = memo(({
  row,
  isExpanded,
  onToggle,
  onAddDocument,
  onPreviewDocument
}) => {
  const handleRowClick = (event) => {
    if (event.target.closest('a, button, input, select, textarea')) return;
    onToggle(row.id);
  };

  return (
    <Fragment>
      <tr
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Xem lịch thanh toán của ${row.projectName || row.contractName}`}
        onClick={handleRowClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle(row.id);
          }
        }}
        className={`cursor-pointer border-t border-[#eff4ff] outline-none focus-visible:bg-[#eff4ff] ${
          isExpanded
            ? 'bg-[#ffdbca]/25'
            : row.contractStatus === 'CANCELLED'
              ? 'bg-[#ffdad6]/25'
              : 'hover:bg-[#eff4ff]/50'
        }`}
      >
        <td className="px-3 py-3 font-semibold">{row.customerName || '—'}</td>
        <td className="max-w-56 truncate px-3 py-3 font-semibold" title={row.projectName || row.contractName}>
          {row.projectName || row.contractName}
        </td>
        <td className="px-3 py-3">{row.salesOwner?.name || '—'}</td>
        <td className="px-3 py-3 font-medium">{row.contractCode}</td>
        <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">
          {currency(row.totalWithVat)}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
          {currency(row.sellingPrice)}
        </td>
        <td className="px-3 py-3">
          <StatusBadge domain="quotation" status={row.quotationStatus} />
        </td>
        <td className="px-3 py-3">
          <StatusBadge domain="contract" status={row.contractStatus} />
        </td>
        <td className="px-3 py-3">{row.projectManager || '—'}</td>
        <td className="px-3 py-3">{row.account || '—'}</td>
        <td className="px-3 py-3">
          <StatusBadge domain="project" status={row.projectStatus} />
        </td>
        <td className="px-3 py-3">
          {row.collectionMonth ? `Tháng ${new Date(row.collectionMonth).getMonth() + 1}` : '—'}
        </td>
        <td className="px-3 py-3 text-center">
          {formatDateToDDMMYYYY(row.latestPaymentDate) || (
            <span className="text-slate-400">---</span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-[#9d4300] tabular-nums">
          {currency(row.unpaidAmount)}
        </td>

        {/* CỘT HỢP ĐỒNG: Xem file trực tiếp không có icon link ngoài */}
        <td className="px-3 py-3 text-center">
          {row.contractFileUrl ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewDocument({
                  url: row.contractFileUrl,
                  fileName: row.contractName || row.contractCode || 'Hợp đồng'
                });
              }}
              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 font-semibold text-[#006c49] transition-all hover:bg-emerald-100 hover:shadow-2xs active:scale-95"
              title="Xem trước file hợp đồng"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Xem file</span>
            </button>
          ) : (
            <span className="text-slate-400 font-normal text-[11px]">Chưa có</span>
          )}
        </td>

        {/* CỘT BBNT */}
        <td className="px-3 py-3 text-center">
          <DocumentCellPill
            docs={row.acceptanceMinutes || []}
            type="acceptance"
            onAdd={() => onAddDocument(row, 'acceptance')}
            onPreview={onPreviewDocument}
          />
        </td>

        {/* CỘT HĐ VAT */}
        <td className="px-3 py-3 text-center">
          <DocumentCellPill
            docs={row.vatInvoices || []}
            type="invoice"
            onAdd={() => onAddDocument(row, 'invoice')}
            onPreview={onPreviewDocument}
          />
        </td>

        <td className="max-w-56 truncate px-3 py-3 text-[#565e74]" title={row.note}>
          {row.note || '—'}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-[#eff4ff]/40">
          <td colSpan={18}>
            <MilestoneList row={row} onPreviewDocument={onPreviewDocument} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}, (prev, next) => {
  return (
    prev.row === next.row &&
    prev.isExpanded === next.isExpanded &&
    prev.onToggle === next.onToggle &&
    prev.onAddDocument === next.onAddDocument &&
    prev.onPreviewDocument === next.onPreviewDocument
  );
});

export const PaymentOverviewTable = ({ rows, onAddDocument, onPreviewDocument }) => {
  const [expanded, setExpanded] = useState('');
  const toggle = useCallback((rowId) => setExpanded((current) => (current === rowId ? '' : rowId)), []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[2400px] text-left text-xs">
        <thead className="bg-[#eff4ff] text-[10px] uppercase tracking-wide text-[#584237]">
          <tr>
            {[
              'Khách hàng', 'Dự án', 'Team KD', 'Số HĐ',
              'Tổng GT HĐ (có VAT)', 'GT thanh toán (chưa VAT)',
              'Trạng thái báo giá', 'Trạng thái hợp đồng',
              'PM', 'Account dự án', 'TT triển khai', 'Tháng theo dõi thu',
              'Ngày TT gần nhất', 'Chưa thanh toán',
              'Hợp đồng', 'BBNT', 'HĐ VAT', 'Ghi chú'
            ].map((title, index) => (
              <th
                key={title}
                className={`whitespace-nowrap px-3 py-3 font-semibold ${
                  [4, 5, 13].includes(index)
                    ? 'text-right'
                    : [12, 14, 15, 16].includes(index)
                      ? 'text-center'
                      : ''
                }`}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <PaymentOverviewRow
              key={row.id}
              row={row}
              isExpanded={expanded === row.id}
              onToggle={toggle}
              onAddDocument={onAddDocument}
              onPreviewDocument={onPreviewDocument}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
