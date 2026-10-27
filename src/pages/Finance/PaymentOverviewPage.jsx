import { useMemo, useState, useRef, useEffect } from 'react';
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  Download, FolderKanban, RefreshCw, Search, WalletCards,
  FileText, X, Clock, ArrowUpRight
} from 'lucide-react';
import { useGetPaymentDashboardQuery } from '../../api/paymentDashboard';
import { formatCurrency, formatDateToDDMMYYYY } from '../../utils/format';
import { CONTRACT_STATUS_LABELS, PROJECT_STATUS_LABELS, QUOTATION_STATUS_LABELS } from '../../utils/enums';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { PaymentOverviewTable } from './PaymentOverviewTable';
import { DocumentUploadModal } from './DocumentUploadModal';

const compactMillionFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

const money = (value) => formatCurrency(Number(value || 0)).replace('VNĐ', '₫');
const compactMoney = (value) => {
  const amount = Number(value || 0);
  if (!amount) return '0 tr';
  return `${compactMillionFormatter.format(amount / 1_000_000)}tr`;
};

const badgeClass = (status) => {
  if (['APPROVED', 'PAID', 'COMPLETED', 'SIGNED', 'PROPOSAL_APPROVED'].includes(status)) return 'bg-positive-light text-positive-strong';
  if (['REJECTED', 'CANCELLED', 'PROPOSAL_REJECTED'].includes(status)) return 'bg-negative-light text-negative-strong';
  if (['PARTIAL', 'IN_PROGRESS'].includes(status)) return 'bg-pending-light text-pending-strong';
  return 'bg-neutral-light text-neutral-strong';
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

  // Tháng đang mở modal chi tiết phân bổ dòng tiền
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedMonthDetail(null);
    };
    if (selectedMonthDetail !== null) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMonthDetail]);

  const { data, isLoading, isFetching, isError, refetch } = useGetPaymentDashboardQuery(filters);
  const rows = data?.rows || [];
  const summary = data?.summary || {};
  const options = data?.filterOptions || {};

  const activeMonthData = useMemo(() => {
    if (selectedMonthDetail === null) return null;
    return (data?.monthly || []).find((m) => m.month === selectedMonthDetail) || null;
  }, [selectedMonthDetail, data?.monthly]);

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
                <h2 className="text-sm font-semibold">Kế hoạch & Thực thu theo tháng · năm {filters.year}</h2>
                <p className="text-[11px] text-[#565e74]">
                  Bấm vào từng tháng để xem chi tiết phân bổ dòng tiền (Thu đúng kỳ, Thu nợ cũ, Thu trước hạn)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3.5 text-[11px] text-[#565e74]">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#006c49]" />Đã thu đủ</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#ffdbca] border border-[#f97316]/40" />Thu 1 phần</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#f97316]" />Chưa thu</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#dbeafe] border border-blue-400" />Thu trước</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-400" />Trả trễ</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#e5eeff]" />Không phát sinh</span>
            </div>
          </div>
          <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.monthly || []).map((month) => {
              const planned = Number(month.planned || 0);
              const paid = Number(month.paid || 0);
              const unpaid = month.unpaid !== undefined ? Number(month.unpaid) : Math.max(0, planned - paid);
              const isOverduePayment = planned <= 0 && paid > 0 && (month.breakdown?.overdue || 0) > 0 && (month.breakdown?.prepaid || 0) <= 0;
              const isPrepaid = planned <= 0 && paid > 0 && !isOverduePayment;
              const isPaid = planned > 0 && paid > 0 && unpaid <= 0;
              const isPartial = planned > 0 && paid > 0 && unpaid > 0;
              const isPending = paid <= 0 && unpaid > 0;
              const active = planned > 0 || paid > 0 || unpaid > 0;
              const rate = planned > 0 ? Math.min(100, Math.round((paid / planned) * 100)) : (paid > 0 ? 100 : 0);
              const isSelected = selectedMonthDetail === month.month;
              const quarter = Math.ceil(month.month / 3);
              const colIndex = (month.month - 1) % 3;

              return (
                <div
                  key={month.month}
                  onClick={() => setSelectedMonthDetail((prev) => prev === month.month ? null : month.month)}
                  title={`Tháng ${month.month}: Bấm để xem chi tiết đối soát dòng tiền`}
                  className={`group relative flex flex-col justify-between rounded-xl p-2.5 transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-white shadow-lg ring-2 ring-[#f97316] border-transparent z-40'
                      : active
                        ? 'bg-white shadow-[0_1px_4px_rgba(33,49,69,0.06)] border border-slate-100 hover:border-[#f97316]/50 hover:shadow-md'
                        : 'bg-[#eff4ff]/60 border border-transparent text-[#565e74] hover:bg-[#eff4ff]'
                  }`}
                >
                  {/* Card Header: Tháng & Tag trạng thái */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#0b1c30]">Tháng {month.month}</span>
                      <span className="text-[10px] font-medium text-slate-400">· Quý {quarter}</span>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold text-center leading-tight ${
                      isOverduePayment
                        ? 'bg-amber-100 text-amber-800'
                        : isPrepaid
                          ? 'bg-[#dbeafe] text-[#1e40af]'
                          : isPaid
                            ? 'bg-[#e5eeff] text-[#006c49]'
                            : isPartial
                              ? 'bg-[#ffdbca] text-[#9d4300]'
                              : isPending
                                ? 'bg-[#ffdad6] text-[#93000a]'
                                : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isOverduePayment ? 'Trả trễ' : isPrepaid ? 'Thu trước' : isPaid ? 'Đã thu đủ' : isPartial ? 'Thu 1 phần' : isPending ? 'Chưa thu' : 'Không phát sinh'}
                    </span>
                  </div>

                  {/* Card Body: Các dòng số liệu tinh gọn */}
                  <div className="my-1.5 flex flex-col gap-1 text-left text-[11px]">
                    {active ? (
                      <>
                        {planned > 0 && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-medium">Kế hoạch thu:</span>
                            <span className="font-bold text-slate-700 tabular-nums">{money(planned)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[#006c49]">
                          <span className="font-medium">Đã thực thu:</span>
                          <span className="font-bold tabular-nums">{money(paid)}</span>
                        </div>
                        {unpaid > 0 && (
                          <div className="flex items-center justify-between text-[#9d4300]">
                            <span className="font-medium">Còn phải thu:</span>
                            <span className="font-bold tabular-nums">{money(unpaid)}</span>
                          </div>
                        )}

                        {/* Progress Bar mini khi có kế hoạch */}
                        {planned > 0 && (
                          <div className="mt-0.5 pt-0.5">
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-slate-400">Tiến độ thu</span>
                              <b className={isPaid ? 'text-[#006c49]' : 'text-slate-700'}>{rate}%</b>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isPaid ? 'bg-[#006c49]' : 'bg-[#f97316]'}`}
                                style={{ width: `${Math.min(100, rate)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-2 text-center text-[11px] text-slate-400 font-medium">
                        — Không phát sinh —
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Gợi ý xem chi tiết */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Đối soát dòng tiền</span>
                    <span className="font-medium text-[#f97316] group-hover:underline">Chi tiết →</span>
                  </div>
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
              {(() => {
                const totalItems = data?.meta?.total ?? rows.length ?? 0;
                const limit = filters.limit || 10;
                const currentPage = filters.page || 1;
                const totalPages = data?.meta?.totalPages || Math.max(1, Math.ceil(totalItems / limit));
                const startItem = totalItems > 0 ? (currentPage - 1) * limit + 1 : 0;
                const endItem = Math.min(totalItems, currentPage * limit);

                const getPageNumbers = () => {
                  const pages = [];
                  const showThreshold = 7;
                  if (totalPages <= showThreshold) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    const left = Math.max(2, currentPage - 1);
                    const right = Math.min(totalPages - 1, currentPage + 1);
                    if (left > 2) pages.push('...');
                    for (let i = left; i <= right; i++) pages.push(i);
                    if (right < totalPages - 1) pages.push('...');
                    pages.push(totalPages);
                  }
                  return pages;
                };

                return (
                  <footer className="flex flex-col justify-between gap-3 px-5 py-3.5 text-xs text-[#565e74] sm:flex-row sm:items-center border-t border-slate-100 bg-white">
                    <div className="flex flex-wrap items-center gap-4">
                      <span>
                        Hiển thị <strong className="text-[#0b1c30] font-semibold">{totalItems > 0 ? `${startItem} – ${endItem}` : '0'}</strong> trong tổng số <strong className="text-[#0b1c30] font-semibold">{totalItems}</strong> dự án
                      </span>
                      <div className="flex items-center gap-2">
                        <span>Dòng mỗi trang:</span>
                        <select
                          value={filters.limit || 10}
                          onChange={(e) => setFilters((state) => ({ ...state, limit: Number(e.target.value), page: 1 }))}
                          className="h-8 px-2 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-medium text-xs outline-none border border-[#dce9ff] cursor-pointer hover:bg-[#e2ebfc] transition-colors"
                        >
                          <option value={10}>10 dòng</option>
                          <option value={25}>25 dòng</option>
                          <option value={50}>50 dòng</option>
                          <option value={100}>100 dòng</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setFilters((state) => ({ ...state, page: state.page - 1 }))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff4ff] text-[#565e74] hover:bg-[#e2ebfc] hover:text-[#0b1c30] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                        title="Trang trước"
                        type="button"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {getPageNumbers().map((pageItem, idx) => (
                        pageItem === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-xs text-[#565e74]">
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageItem}
                            onClick={() => setFilters((state) => ({ ...state, page: pageItem }))}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition-all ${
                              currentPage === pageItem
                                ? 'bg-[#f97316] text-white shadow-xs font-bold'
                                : 'bg-[#eff4ff] text-[#565e74] hover:bg-[#e2ebfc] hover:text-[#0b1c30]'
                            }`}
                            type="button"
                          >
                            {pageItem}
                          </button>
                        )
                      ))}

                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setFilters((state) => ({ ...state, page: state.page + 1 }))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff4ff] text-[#565e74] hover:bg-[#e2ebfc] hover:text-[#0b1c30] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                        title="Trang sau"
                        type="button"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </footer>
                );
              })()}
            </section>
      </div>

      {/* Modal chi tiết phân bổ dòng tiền tháng */}
      {activeMonthData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedMonthDetail(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left border border-slate-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#f97316]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0b1c30]">
                    Dòng tiền thực thu · Tháng {activeMonthData.month}/{filters.year}
                  </h3>
                  <p className="text-xs text-slate-500">Phân loại tiền về tài khoản theo kỳ hạn đợt thanh toán</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMonthDetail(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                title="Đóng (ESC)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nội dung Modal (Cuộn được nếu danh sách dài) */}
            <div className="overflow-y-auto mt-4 pr-1 space-y-3 flex-1">
              {/* Tổng thực nhận trong tháng */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-3.5 border border-emerald-100/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Tổng thực nhận trong tháng
                  </span>
                  <b className="text-xl font-bold text-[#006c49] tabular-nums mt-0.5 block">
                    {money(activeMonthData.cashPaid || activeMonthData.breakdown?.total || 0)}
                  </b>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shadow-2xs">
                  Tiền về tài khoản
                </span>
              </div>

              {/* 3 Thẻ phân loại: Đúng kỳ / Nợ cũ / Thu trước */}
              <div className="space-y-2">
                {/* 1. Thu đúng kỳ */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full bg-[#006c49] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#006c49] block">
                        Thu đúng kỳ (Tháng {activeMonthData.month})
                      </span>
                      <span className="text-[11px] text-slate-500">Đợt thanh toán có hạn trong tháng này</span>
                    </div>
                  </div>
                  <b className="text-sm font-bold text-[#006c49] tabular-nums shrink-0">
                    {money(activeMonthData.breakdown?.onTime || 0)}
                  </b>
                </div>

                {/* 2. Thu nợ các kỳ trước */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full bg-[#b45309] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#b45309] block">
                        Thu nợ cũ (Kỳ trước)
                      </span>
                      <span className="text-[11px] text-slate-500">Khách trả trễ cho các đợt trước đó</span>
                    </div>
                  </div>
                  <b className="text-sm font-bold text-[#b45309] tabular-nums shrink-0">
                    {money(activeMonthData.breakdown?.overdue || 0)}
                  </b>
                </div>

                {/* 3. Thu trước cho các kỳ sau */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full bg-[#1e40af] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#1e40af] block">
                        Thu trước (Kỳ sau)
                      </span>
                      <span className="text-[11px] text-slate-500">Khách thanh toán sớm cho các đợt sau</span>
                    </div>
                  </div>
                  <b className="text-sm font-bold text-[#1e40af] tabular-nums shrink-0">
                    {money(activeMonthData.breakdown?.prepaid || 0)}
                  </b>
                </div>
              </div>

              {/* Danh sách các giao dịch cụ thể */}
              {activeMonthData.breakdown?.details && activeMonthData.breakdown.details.length > 0 ? (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Chi tiết các khoản thu ({activeMonthData.breakdown.details.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Dự án · Số tiền</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {activeMonthData.breakdown.details.map((item, idx) => (
                      <div key={item.id || idx} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs hover:bg-slate-100/70 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800 truncate" title={item.projectName}>
                            {item.projectName}
                          </span>
                          <span className="font-bold text-[#006c49] tabular-nums shrink-0">
                            +{money(item.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                          <span className="truncate max-w-64" title={item.milestoneName}>
                            {item.milestoneName || 'Đợt thanh toán'}
                            {item.paymentDate ? ` · Ngày TT: ${formatDateToDDMMYYYY(item.paymentDate)}` : ''}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] shrink-0 ${
                            item.type === 'ON_TIME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.type === 'OVERDUE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'ON_TIME' ? 'Đúng kỳ' : item.type === 'OVERDUE' ? `Hạn T${item.dueMonth} (Trễ)` : `Hạn T${item.dueMonth} (Thu trước)`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Tháng này chưa ghi nhận giao dịch thu tiền vào tài khoản.
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMonthDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
