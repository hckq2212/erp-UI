import { useState } from 'react';
import {
  FileCheck, Plus, Eye, Search, CheckCircle2, Clock,
  FolderKanban, FileText, ChevronRight
} from 'lucide-react';
import { formatDateToDDMMYYYY } from '../../utils/format';
import { CONTRACT_STATUS_LABELS, PROJECT_STATUS_LABELS } from '../../utils/enums';

const StatusBadge = ({ status, children }) => {
  const color = ['APPROVED', 'PAID', 'COMPLETED', 'SIGNED'].includes(status)
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : ['REJECTED', 'CANCELLED', 'OVERDUE'].includes(status)
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : ['PARTIAL', 'IN_PROGRESS'].includes(status)
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
};

export const AcceptanceMinutesTab = ({
  rows = [],
  onAddDocument,
  onPreviewDocument
}) => {
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | HAS_DOCS | NO_DOCS

  // Thống kê nhanh
  const totalAcceptanceMinutes = rows.reduce(
    (acc, row) => acc + (row.acceptanceMinutes?.length || 0),
    0
  );
  const projectsWithDocs = rows.filter((r) => (r.acceptanceMinutes?.length || 0) > 0).length;
  const projectsWithoutDocs = rows.length - projectsWithDocs;

  const filteredRows = rows.filter((r) => {
    const count = r.acceptanceMinutes?.length || 0;
    if (filterMode === 'HAS_DOCS') return count > 0;
    if (filterMode === 'NO_DOCS') return count === 0;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 3 Thẻ thống kê nhanh của phân hệ Nghiệm thu */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng biên bản nghiệm thu
            </span>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
              {totalAcceptanceMinutes}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Đã lưu trữ trên hệ thống</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#006c49]">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dự án đã có BBNT
            </span>
            <div className="mt-1 text-2xl font-bold tabular-nums text-[#006c49]">
              {projectsWithDocs} <span className="text-xs font-medium text-slate-500">/ {rows.length} dự án</span>
            </div>
            <p className="mt-0.5 text-xs text-emerald-600 font-medium">
              Đạt {rows.length ? Math.round((projectsWithDocs / rows.length) * 100) : 0}% tổng dự án
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#006c49]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dự án chưa có BBNT
            </span>
            <div className="mt-1 text-2xl font-bold tabular-nums text-[#ea580c]">
              {projectsWithoutDocs} <span className="text-xs font-medium text-slate-500">dự án cần bổ sung</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Cần liên hệ PM / Khách hàng</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff5ee] text-[#ea580c]">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Trạng thái BBNT:</span>
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
                ? 'bg-[#006c49] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đã có BBNT ({projectsWithDocs})
          </button>
          <button
            onClick={() => setFilterMode('NO_DOCS')}
            className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'NO_DOCS'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chưa có BBNT ({projectsWithoutDocs})
          </button>
        </div>
        <div className="text-xs text-slate-500">
          Hiển thị <span className="font-bold text-slate-800">{filteredRows.length}</span> dự án
        </div>
      </div>

      {/* Bảng danh sách dự án & BBNT giống lộ trình */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-left text-xs">
            <thead className="bg-[#eff4ff] text-[10px] uppercase tracking-wide text-[#584237]">
              <tr>
                <th className="px-3 py-3 font-semibold w-12 text-center">STT</th>
                <th className="px-3 py-3 font-semibold">Khách hàng</th>
                <th className="px-3 py-3 font-semibold">Dự án</th>
                <th className="px-3 py-3 font-semibold">Số HĐ</th>
                <th className="px-3 py-3 font-semibold">Team KD</th>
                <th className="px-3 py-3 font-semibold">PM / Account</th>
                <th className="px-3 py-3 font-semibold">TT Triển khai</th>
                <th className="px-3 py-3 font-semibold text-center w-24">Số lượng</th>
                <th className="px-3 py-3 font-semibold min-w-[400px]">Danh sách Biên bản nghiệm thu</th>
                <th className="px-3 py-3 font-semibold text-center w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <FileCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-sm text-slate-600">Không có dự án phù hợp với bộ lọc</p>
                    <p className="text-xs text-slate-400 mt-0.5">Vui lòng thay đổi tùy chọn hoặc bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const docs = row.acceptanceMinutes || [];
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
                      <td className="px-3 py-3 text-slate-600">
                        <div>{row.projectManager || '—'}</div>
                        {row.account && <div className="text-[10px] text-slate-400">Acc: {row.account}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.projectStatus}>
                          {PROJECT_STATUS_LABELS[row.projectStatus] || 'Chưa triển khai'}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full font-bold text-xs ${
                            docs.length > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {docs.length}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {docs.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {docs.map((doc, docIndex) => (
                              <div
                                key={doc.id || docIndex}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 pl-2.5 pr-1.5 py-1 text-xs text-emerald-900 shadow-2xs hover:bg-emerald-50 transition-colors"
                              >
                                <FileCheck className="h-3.5 w-3.5 text-[#006c49] shrink-0" />
                                <span className="font-semibold max-w-48 truncate" title={doc.name}>
                                  {doc.name}
                                </span>
                                {doc.createdAt && (
                                  <span className="text-[10px] text-emerald-600 font-normal">
                                    ({formatDateToDDMMYYYY(doc.createdAt)})
                                  </span>
                                )}
                                <div className="ml-1 flex items-center border-l border-emerald-200 pl-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onPreviewDocument({
                                        url: doc.fileUrl,
                                        fileName: doc.name
                                      })
                                    }
                                    title="Xem trước BBNT"
                                    className="p-1 rounded-md text-[#006c49] hover:bg-white hover:shadow-xs transition-all"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Chưa có biên bản nghiệm thu nào
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onAddDocument(row, 'acceptance')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-[#006c49] transition-all active:scale-95 shadow-2xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Thêm BBNT</span>
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
