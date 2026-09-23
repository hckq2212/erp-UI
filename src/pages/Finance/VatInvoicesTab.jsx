import { useState } from 'react';
import {
  Receipt, Plus, Eye, CheckCircle2, Clock,
  FileSpreadsheet, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDateToDDMMYYYY } from '../../utils/format';

const currency = (value) => formatCurrency(Number(value || 0)).replace('VNĐ', '₫');

export const VatInvoicesTab = ({
  rows = [],
  onAddDocument,
  onPreviewDocument
}) => {
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | HAS_DOCS | NO_DOCS

  // Thống kê nhanh
  const totalVatInvoices = rows.reduce(
    (acc, row) => acc + (row.vatInvoices?.length || 0),
    0
  );
  const projectsWithInvoices = rows.filter((r) => (r.vatInvoices?.length || 0) > 0).length;
  const projectsWithoutInvoices = rows.length - projectsWithInvoices;

  const filteredRows = rows.filter((r) => {
    const count = r.vatInvoices?.length || 0;
    if (filterMode === 'HAS_DOCS') return count > 0;
    if (filterMode === 'NO_DOCS') return count === 0;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 3 Thẻ thống kê nhanh của phân hệ Hóa đơn VAT */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng hóa đơn VAT
            </span>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
              {totalVatInvoices}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Đã lưu trữ trên hệ thống</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff5ee] text-[#ea580c]">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dự án đã có HĐ VAT
            </span>
            <div className="mt-1 text-2xl font-bold tabular-nums text-[#006c49]">
              {projectsWithInvoices} <span className="text-xs font-medium text-slate-500">/ {rows.length} dự án</span>
            </div>
            <p className="mt-0.5 text-xs text-emerald-600 font-medium">
              Đạt {rows.length ? Math.round((projectsWithInvoices / rows.length) * 100) : 0}% tổng dự án
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#006c49]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dự án chưa xuất HĐ VAT
            </span>
            <div className="mt-1 text-2xl font-bold tabular-nums text-[#ea580c]">
              {projectsWithoutInvoices} <span className="text-xs font-medium text-slate-500">dự án cần xuất HĐ</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Theo dõi xuất hóa đơn VAT cho khách</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff5ee] text-[#ea580c]">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Trạng thái HĐ VAT:</span>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({rows.length})
          </button>
          <button
            onClick={() => setFilterMode('HAS_DOCS')}
            className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'HAS_DOCS'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đã có HĐ VAT ({projectsWithInvoices})
          </button>
          <button
            onClick={() => setFilterMode('NO_DOCS')}
            className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'NO_DOCS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chưa có HĐ VAT ({projectsWithoutInvoices})
          </button>
        </div>
        <div className="text-xs text-slate-500">
          Hiển thị <span className="font-bold text-slate-800">{filteredRows.length}</span> dự án
        </div>
      </div>

      {/* Bảng danh sách dự án & Hóa đơn VAT giống lộ trình */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-left text-xs">
            <thead className="bg-[#eff4ff] text-[10px] uppercase tracking-wide text-[#584237]">
              <tr>
                <th className="px-3 py-3 font-semibold w-12 text-center">STT</th>
                <th className="px-3 py-3 font-semibold">Khách hàng</th>
                <th className="px-3 py-3 font-semibold">Dự án</th>
                <th className="px-3 py-3 font-semibold">Số HĐ</th>
                <th className="px-3 py-3 font-semibold">Team KD</th>
                <th className="px-3 py-3 font-semibold text-right">Tổng GT HĐ (có VAT)</th>
                <th className="px-3 py-3 font-semibold text-right">GT chưa VAT</th>
                <th className="px-3 py-3 font-semibold text-right">Đã thanh toán</th>
                <th className="px-3 py-3 font-semibold text-center w-24">Số lượng HĐ</th>
                <th className="px-3 py-3 font-semibold min-w-[420px]">Danh sách Hóa đơn VAT</th>
                <th className="px-3 py-3 font-semibold text-center w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-sm text-slate-600">Không có dự án phù hợp với bộ lọc</p>
                    <p className="text-xs text-slate-400 mt-0.5">Vui lòng thay đổi tùy chọn hoặc bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const invoices = row.vatInvoices || [];
                  const paid = Number(row.sellingPrice || 0) + Number(row.vatAmount || 0) - Number(row.unpaidAmount || 0);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="px-3 py-3 text-center text-slate-400 font-medium">{index + 1}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{row.customerName || '—'}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900 max-w-64">
                        <div className="truncate" title={row.projectName || row.contractName}>
                          {row.projectName || row.contractName}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">{row.contractCode || '—'}</td>
                      <td className="px-3 py-3 text-slate-600">{row.salesOwner?.name || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums text-slate-900">
                        {currency(row.totalWithVat)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-600">
                        {currency(row.sellingPrice)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-[#006c49]">
                        {currency(Math.max(0, paid))}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full font-bold text-xs ${
                            invoices.length > 0
                              ? 'bg-[#ffebd6] text-[#ea580c]'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {invoices.length}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {invoices.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {invoices.map((doc, docIndex) => (
                              <div
                                key={doc.id || docIndex}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 pl-2.5 pr-1.5 py-1 text-xs text-amber-900 shadow-2xs hover:bg-amber-50 transition-colors"
                              >
                                <Receipt className="h-3.5 w-3.5 text-[#ea580c] shrink-0" />
                                <span className="font-semibold max-w-48 truncate" title={doc.name}>
                                  {doc.name}
                                </span>
                                {doc.createdAt && (
                                  <span className="text-[10px] text-amber-700 font-normal">
                                    ({formatDateToDDMMYYYY(doc.createdAt)})
                                  </span>
                                )}
                                <div className="ml-1 flex items-center border-l border-amber-200 pl-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onPreviewDocument({
                                        url: doc.fileUrl,
                                        fileName: doc.name
                                      })
                                    }
                                    title="Xem trước HĐ VAT"
                                    className="p-1 rounded-md text-[#ea580c] hover:bg-white hover:shadow-xs transition-all"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Chưa có hóa đơn VAT nào
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onAddDocument(row, 'invoice')}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-[#fff5ee] hover:bg-[#ffebd6] px-2.5 py-1.5 text-xs font-semibold text-[#ea580c] transition-all active:scale-95 shadow-2xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Thêm HĐ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
