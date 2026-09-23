import { useMemo, useState } from 'react';
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  Download, FolderKanban, RefreshCw, Search, WalletCards,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGetPaymentDashboardQuery } from '../../api/paymentDashboard';
import { formatCurrency, formatDateToDDMMYYYY } from '../../utils/format';
import { CONTRACT_STATUS_LABELS, PROJECT_STATUS_LABELS, QUOTATION_STATUS_LABELS } from '../../utils/enums';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { PaymentOverviewTable } from './PaymentOverviewTable';
import { DocumentUploadModal } from './DocumentUploadModal';

const money = (value) => formatCurrency(Number(value || 0)).replace('VNĐ', '₫');
const compactMoney = (value) => {
  const amount = Number(value || 0);
  if (!amount) return '0 tr';
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000_000)}tr`;
};

const badgeClass = (status) => {
  if (['APPROVED', 'PAID', 'COMPLETED', 'SIGNED', 'PROPOSAL_APPROVED'].includes(status)) return 'bg-[#e5eeff] text-[#006c49]';
  if (['REJECTED', 'CANCELLED', 'PROPOSAL_REJECTED'].includes(status)) return 'bg-[#ffdad6] text-[#93000a]';
  if (['PARTIAL', 'IN_PROGRESS'].includes(status)) return 'bg-[#ffdbca] text-[#9d4300]';
  return 'bg-[#eff4ff] text-[#584237]';
};

const StatusBadge = ({ status, children }) => (
  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold leading-tight ${badgeClass(status)}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />{children}
  </span>
);

const MetricCard = ({ title, value, icon: Icon, valueClass = 'text-[#0b1c30]', children }) => (
  <article className="flex min-h-40 flex-col justify-between rounded-xl bg-white p-5 shadow-[0_2px_10px_rgba(33,49,69,0.05)]">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#565e74]">{title}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffdbca]/60 text-[#9d4300]">
        <Icon className="h-4.5 w-4.5" />
      </span>
    </div>
    <div className={`mt-3 text-[22px] font-bold tabular-nums ${valueClass}`}>{value}</div>
    <div className="mt-3 text-xs text-[#565e74]">{children}</div>
  </article>
);

export const PaymentOverviewPage = () => {
  const currentYear = new Date().getFullYear();
  const baseFilters = {
    year: currentYear, search: '', customerId: '', salesOwnerId: '',
    projectManagerId: '', projectStatus: '', paymentStatus: '',
    confirmationStatus: '', paymentMonth: '', page: 1, limit: 10
  };
  const [filters, setFilters] = useState(baseFilters);
  const [search, setSearch] = useState('');

  // Target cho modal upload tài liệu
  const [documentTarget, setDocumentTarget] = useState(null);

  // Target cho modal xem trước tài liệu đa năng
  const [previewTarget, setPreviewTarget] = useState(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetPaymentDashboardQuery(filters);
  const rows = data?.rows || [];
  const summary = data?.summary || {};
  const options = data?.filterOptions || {};

  const update = (key, value) => setFilters((state) => ({ ...state, [key]: value, page: 1 }));

  const tabs = useMemo(() => [
    ['ALL', `Tất cả (${data?.tabCounts?.all || 0})`],
    ['WAITING', `Đợi thu tiền (${data?.tabCounts?.waiting || 0})`],
    ['PAID', `Đã thanh toán (${data?.tabCounts?.paid || 0})`],
    ['UNCONFIRMED', `Chưa xác nhận (${data?.tabCounts?.unconfirmed || 0})`],
  ], [data?.tabCounts]);

  const activeStatusTab = filters.confirmationStatus === 'UNCONFIRMED'
    ? 'UNCONFIRMED'
    : filters.paymentStatus === 'PAID'
      ? 'PAID'
      : filters.paymentStatus === 'WAITING'
        ? 'WAITING'
        : 'ALL';

  const changeStatusTab = (value) => setFilters((state) => ({
    ...state,
    page: 1,
    paymentStatus: value === 'PAID' ? 'PAID' : value === 'WAITING' ? 'WAITING' : '',
    confirmationStatus: value === 'UNCONFIRMED' ? 'UNCONFIRMED' : '',
  }));

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(rows.map((row) => ({
      'Khách hàng': row.customerName,
      'Dự án': row.projectName,
      'Team KD': row.salesOwner?.name,
      'Số HĐ': row.contractCode,
      'Trạng thái báo giá': QUOTATION_STATUS_LABELS[row.quotationStatus],
      'Trạng thái hợp đồng': CONTRACT_STATUS_LABELS[row.contractStatus],
      'PM': row.projectManager,
      'Account dự án': row.account,
      'Trạng thái triển khai': PROJECT_STATUS_LABELS[row.projectStatus],
      'Tháng theo dõi thu': row.collectionMonth ? new Date(row.collectionMonth).getMonth() + 1 : '',
      'Tổng GT HĐ có VAT': row.totalWithVat,
      'GT thanh toán chưa VAT': row.sellingPrice,
      'Ngày TT gần nhất': formatDateToDDMMYYYY(row.latestPaymentDate),
      'Chưa thanh toán': row.unpaidAmount,
      'Số BBNT': row.acceptanceMinutes?.length || 0,
      'Số HĐ VAT': row.vatInvoices?.length || 0,
    })));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Lộ trình thanh toán');
    XLSX.writeFile(book, `lo-trinh-thanh-toan-${filters.year}.xlsx`);
  };

  const filterSelectClass = 'h-9 rounded-xl bg-[#eff4ff] px-3 text-sm text-[#584237] outline-none ring-[#f97316] focus:ring-1';

  return (
    <div className="-m-4 min-h-full bg-[#f8f9ff] p-4 text-[#0b1c30] sm:-m-6 sm:p-6">

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
        {/* Header trang */}
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                Thanh toán & Chứng từ dự án
              </h1>
              <span className="rounded-full bg-[#ffdbca] px-2.5 py-1 text-[11px] font-bold text-[#9d4300]">
                Niên độ {filters.year}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#565e74]">
              Theo dõi lộ trình thanh toán, biên bản nghiệm thu (BBNT) và hóa đơn VAT theo từng dự án · Cập nhật {formatDateToDDMMYYYY(new Date())}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex h-9 items-center gap-2 rounded-xl bg-[#eff4ff] px-3 text-sm font-semibold text-[#584237]">
              <CalendarDays className="h-4 w-4" />
              <span>Năm tài chính</span>
              <select
                aria-label="Chọn năm tài chính"
                value={filters.year}
                onChange={(event) => update('year', Number(event.target.value))}
                className="bg-transparent font-bold text-[#0b1c30] outline-none cursor-pointer"
              >
                {Array.from({ length: 8 }, (_, index) => currentYear + 2 - index).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>

            <button
              onClick={refetch}
              className="flex h-9 items-center gap-2 rounded-xl bg-[#eff4ff] px-3 text-sm font-semibold text-[#584237] hover:bg-[#e0eafc] transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </button>

            <button
              onClick={exportExcel}
              className="flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold shadow-xs hover:bg-slate-50 transition-colors border border-slate-200"
            >
              <Download className="h-4 w-4 text-[#006c49]" />
              Xuất Excel / PDF
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Tổng giá trị hợp đồng" value={money(summary.totalContractValue)} icon={WalletCards}>
            <div className="flex justify-between">
              <span>Tiến độ thực thu</span>
              <b className="text-[#006c49]">{Number(summary.collectionRate || 0).toFixed(1)}%</b>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5eeff]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#00b07a]"
                style={{ width: `${Math.min(100, Number(summary.collectionRate || 0))}%` }}
              />
            </div>
          </MetricCard>

          <MetricCard title="Đã thanh toán" value={money(summary.totalPaid)} icon={CheckCircle2} valueClass="text-[#006c49]">
            <StatusBadge status="PAID">Đã ghi nhận thanh toán</StatusBadge>
          </MetricCard>

          <MetricCard title="Chưa thanh toán" value={money(summary.totalUnpaid)} icon={CalendarDays} valueClass="text-[#9d4300]">
            <StatusBadge status="PARTIAL">Các đợt còn phải thu</StatusBadge>
          </MetricCard>

          <MetricCard
            title="Số dự án theo dõi"
            value={
              <>
                {summary.trackingContracts || 0}{' '}
                <span className="text-base font-semibold text-[#565e74]">/ {summary.totalContracts || 0} Hợp đồng</span>
              </>
            }
            icon={FolderKanban}
          >
            <span>{summary.cancelledContracts || 0} hợp đồng đã hủy không tính KPI</span>
          </MetricCard>
        </section>

        {/* Dòng tiền 12 tháng */}
        <section className="rounded-xl bg-white p-5 shadow-[0_2px_10px_rgba(33,49,69,0.05)] border border-slate-100">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffdbca] text-[#9d4300]">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Thu tiền theo tháng · năm {filters.year}</h2>
                <p className="text-[11px] text-[#565e74]">Dòng tiền phân bổ theo các kỳ thực tế và kế hoạch</p>
              </div>
            </div>
            <div className="flex gap-4 text-[11px] text-[#565e74]">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#006c49]" />Đã thanh toán</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#f97316]" />Chưa thu</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#e5eeff]" />Không phát sinh</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6 xl:grid-cols-12">
            {(data?.monthly || []).map((month) => {
              const pending = Math.max(0, Number(month.planned) - Number(month.paid));
              const active = month.paid > 0 || pending > 0;
              return (
                <div
                  key={month.month}
                  className={`flex min-h-20 flex-col items-center justify-center rounded-xl p-2 text-center ${
                    active ? 'bg-white shadow-[0_1px_6px_rgba(33,49,69,0.08)] border border-slate-100' : 'bg-[#eff4ff]/70 text-[#565e74]'
                  }`}
                >
                  <span className="text-[11px] font-semibold">T{month.month}</span>
                  <b className={`my-1 text-xs ${pending > 0 ? 'text-[#9d4300]' : 'text-[#0b1c30]'}`}>
                    {active ? compactMoney(month.paid || pending) : '—'}
                  </b>
                  <span className={`rounded px-1 text-[10px] font-semibold ${
                    pending > 0 ? 'bg-[#9d4300] text-white' : month.paid > 0 ? 'bg-[#e5eeff] text-[#006c49]' : 'text-[#8c7164]'
                  }`}>
                    {pending > 0 ? 'Chưa thu' : month.paid > 0 ? 'Đã nhận' : '0 tr'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Thanh công cụ lọc & tìm kiếm dữ liệu (Filter Toolbar đặt ngay trên bảng danh sách) */}
        <section className="rounded-xl bg-white p-3 shadow-[0_2px_10px_rgba(33,49,69,0.05)] border border-slate-100">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1">
              {tabs.map(([value, title]) => (
                <button
                  key={value}
                  onClick={() => changeStatusTab(value)}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition-all ${
                    activeStatusTab === value
                      ? 'bg-white text-[#9d4300] shadow-xs ring-1 ring-[#e0c0b1] font-bold'
                      : 'text-[#565e74] hover:bg-[#eff4ff]'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                update('search', search);
              }}
              className="relative"
            >
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#565e74]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-full rounded-xl bg-[#eff4ff] pl-9 pr-3 text-xs text-[#0b1c30] outline-none ring-[#f97316] focus:ring-1 lg:w-72 font-medium"
                placeholder="Tìm kiếm nhanh dự án, hợp đồng..."
              />
            </form>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
            <select
              className={filterSelectClass}
              value={filters.customerId}
              onChange={(event) => update('customerId', event.target.value)}
            >
              <option value="">Khách hàng: Tất cả</option>
              {(options.customers || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <select
              className={filterSelectClass}
              value={filters.salesOwnerId}
              onChange={(event) => update('salesOwnerId', event.target.value)}
            >
              <option value="">Team KD: Tất cả</option>
              {(options.salesOwners || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <select
              className={filterSelectClass}
              value={filters.projectManagerId}
              onChange={(event) => update('projectManagerId', event.target.value)}
            >
              <option value="">PM: Tất cả</option>
              {(options.projectManagers || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <select
              className={filterSelectClass}
              value={filters.projectStatus}
              onChange={(event) => update('projectStatus', event.target.value)}
            >
              <option value="">TT triển khai: Tất cả</option>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, title]) => (
                <option key={value} value={value}>{title}</option>
              ))}
            </select>

            <select
              className={filterSelectClass}
              value={filters.paymentMonth}
              onChange={(event) => update('paymentMonth', event.target.value)}
            >
              <option value="">Tháng thu: Tất cả</option>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearch('');
                setFilters(baseFilters);
              }}
              className="h-9 text-xs font-bold text-[#9d4300] hover:underline transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </section>

        {/* Bảng lộ trình thanh toán */}
        <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_10px_rgba(33,49,69,0.05)] border border-slate-100">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Danh sách hợp đồng & tiến độ thu</h2>
                  <p className="mt-0.5 text-[11px] text-[#565e74]">Hiển thị {rows.length} / {data?.meta?.total || 0} hợp đồng</p>
                </div>
              </div>
              {isLoading ? (
                <div className="p-16 text-center text-sm text-[#565e74]">Đang tải dữ liệu...</div>
              ) : isError ? (
                <div className="p-16 text-center text-sm text-[#93000a]">Không thể tải dữ liệu dashboard.</div>
              ) : rows.length === 0 ? (
                <div className="p-16 text-center text-sm text-[#565e74]">Không có hợp đồng phù hợp.</div>
              ) : (
                <PaymentOverviewTable
                  rows={rows}
                  onAddDocument={(row, type) => setDocumentTarget({ row, type })}
                  onPreviewDocument={(target) => setPreviewTarget(target)}
                />
              )}
              <footer className="flex flex-col justify-between gap-3 px-5 py-3 text-xs text-[#565e74] sm:flex-row sm:items-center border-t border-slate-100">
                <span>
                  Hiển thị <b className="text-[#0b1c30]">{rows.length}</b> trong tổng số <b className="text-[#0b1c30]">{data?.meta?.total || 0}</b> dự án
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((state) => ({ ...state, page: state.page - 1 }))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff4ff] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#f97316] px-2 font-semibold text-white">
                    {filters.page}
                  </span>
                  <button
                    disabled={filters.page >= (data?.meta?.totalPages || 1)}
                    onClick={() => setFilters((state) => ({ ...state, page: state.page + 1 }))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff4ff] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </footer>
            </section>
      </div>

      {/* Modal tải lên tài liệu */}
      {documentTarget && (
        <DocumentUploadModal
          isOpen={Boolean(documentTarget)}
          onClose={() => setDocumentTarget(null)}
          row={documentTarget.row}
          initialType={documentTarget.type}
          onSuccess={() => {
            refetch();
            setDocumentTarget(null);
          }}
        />
      )}

      {/* Modal xem trước tài liệu đa năng */}
      <DocumentPreviewModal
        isOpen={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        url={previewTarget?.url}
        fileName={previewTarget?.fileName}
      />
    </div>
  );
};
