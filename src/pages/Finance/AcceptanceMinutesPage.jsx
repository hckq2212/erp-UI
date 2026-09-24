import { useState, useMemo } from 'react';
import {
  Upload, Search, Download, Eye, RefreshCcw, FileCheck,
  FileSpreadsheet, FileImage, FileText, File as FileIcon,
  Calendar, Building2, CheckCircle2, ChevronRight, Filter
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useGetPaymentDashboardQuery } from '../../api/paymentDashboard';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { DocumentUploadModal } from './DocumentUploadModal';
import { formatCurrency, formatDateToDDMMYYYY, formatDateTime } from '../../utils/format';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'nameAZ', label: 'Tên A-Z' },
  { value: 'projectAZ', label: 'Dự án A-Z' },
];

const getFileIcon = (url = '', name = '') => {
  const ext = (name || url).split('.').pop()?.toLowerCase();
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return FileImage;
  if (['pdf', 'doc', 'docx'].includes(ext)) return FileText;
  return FileCheck;
};

export const AcceptanceMinutesPage = () => {
  const currentYear = new Date().getFullYear();
  const { data, isLoading, refetch } = useGetPaymentDashboardQuery({
    year: currentYear,
    page: 1,
    limit: 100,
  });

  const contracts = data?.rows || [];

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('newest');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);

  // Danh sách phẳng tất cả biên bản nghiệm thu kèm thông tin Dự án & Hợp đồng
  const allMinutes = useMemo(() => {
    const list = [];
    contracts.forEach((contract) => {
      (contract.acceptanceMinutes || []).forEach((minute) => {
        list.push({
          ...minute,
          contractId: contract.id,
          contractCode: contract.contractCode,
          contractName: contract.contractName,
          projectName: contract.projectName || contract.contractName,
          customerName: contract.customerName,
          customerId: contract.customerId,
          sellingPrice: contract.sellingPrice,
          totalWithVat: contract.totalWithVat,
          vatRate: contract.vatRate,
          salesOwner: contract.salesOwner,
          projectManager: contract.projectManager,
          milestones: contract.milestones || []
        });
      });
    });
    return list;
  }, [contracts]);

  // Danh sách các dự án và khách hàng duy nhất để hiển thị dropdown lọc
  const projectOptions = useMemo(() => {
    const map = new Map();
    contracts.forEach((c) => {
      if (c.id && (c.projectName || c.contractName)) {
        map.set(c.id, { id: c.id, name: c.projectName || c.contractName, code: c.contractCode });
      }
    });
    return Array.from(map.values());
  }, [contracts]);

  const customerOptions = useMemo(() => {
    const map = new Map();
    contracts.forEach((c) => {
      if (c.customerId && c.customerName) {
        map.set(c.customerId, { id: c.customerId, name: c.customerName });
      }
    });
    return Array.from(map.values());
  }, [contracts]);

  // Áp dụng bộ lọc & sắp xếp
  const filteredMinutes = useMemo(() => {
    return allMinutes.filter((item) => {
      // Tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(term);
        const matchProject = (item.projectName || '').toLowerCase().includes(term);
        const matchCode = (item.contractCode || '').toLowerCase().includes(term);
        const matchCustomer = (item.customerName || '').toLowerCase().includes(term);
        if (!matchName && !matchProject && !matchCode && !matchCustomer) return false;
      }

      // Lọc theo Dự án / Hợp đồng
      if (selectedProjectId !== 'all' && item.contractId !== selectedProjectId) {
        return false;
      }

      // Lọc theo Khách hàng
      if (selectedCustomerId !== 'all' && item.customerId !== selectedCustomerId) {
        return false;
      }

      // Lọc theo ngày
      if (fromDate) {
        const itemDate = item.createdAt ? new Date(item.createdAt) : null;
        if (itemDate && itemDate < new Date(fromDate)) return false;
      }
      if (toDate) {
        const itemDate = item.createdAt ? new Date(item.createdAt) : null;
        if (itemDate && itemDate > new Date(`${toDate}T23:59:59`)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sort === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sort === 'nameAZ') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sort === 'projectAZ') {
        return (a.projectName || '').localeCompare(b.projectName || '');
      }
      return 0;
    });
  }, [allMinutes, searchTerm, selectedProjectId, selectedCustomerId, fromDate, toDate, sort]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedProjectId('all');
    setSelectedCustomerId('all');
    setFromDate('');
    setToDate('');
    setSort('newest');
    refetch();
  };

  const handleDownload = (item) => {
    if (!item.fileUrl) return;
    const link = document.createElement('a');
    link.href = item.fileUrl;
    link.download = item.name || 'Bien_ban_nghiem_thu';
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* 1. Header trang (chuẩn style DocumentLibraryPage) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-50 text-[#006c49]">
              <FileCheck className="w-7 h-7" />
            </span>
            Biên bản nghiệm thu
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và tra cứu hồ sơ biên bản nghiệm thu (BBNT) theo từng dự án & hợp đồng
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-[#006c49] hover:bg-[#005236] text-white">
          <Upload className="w-4 h-4 mr-2" />
          Tải lên biên bản
        </Button>
      </div>

      {/* 2. Thanh bộ lọc Filter Card (chuẩn phong cách Kho tài liệu) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên biên bản, dự án, mã HĐ..."
            className="pl-9"
          />
        </div>

        {/* Lọc theo Dự án */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
        >
          <option value="all">Tất cả dự án ({projectOptions.length})</option>
          {projectOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.code ? `[${opt.code}] ` : ''}{opt.name}
            </option>
          ))}
        </select>

        {/* Lọc theo Khách hàng */}
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
        >
          <option value="all">Tất cả khách hàng</option>
          {customerOptions.map((cust) => (
            <option key={cust.id} value={cust.id}>{cust.name}</option>
          ))}
        </select>

        {/* Từ ngày */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Từ</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
          />
        </div>

        {/* Đến ngày */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Đến</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
          />
        </div>

        {/* Sắp xếp & Làm mới */}
        <div className="flex gap-2 md:col-span-6 justify-between items-center pt-1 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 ml-2">
              Hiển thị <b className="text-gray-700">{filteredMinutes.length}</b> biên bản nghiệm thu
            </span>
          </div>

          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-widest rounded-lg hover:bg-gray-100 hover:text-[#006c49] transition-all"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>
      </div>

      {/* 3. Bảng danh sách Biên bản nghiệm thu (chuẩn table DocumentLibraryPage) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tên biên bản nghiệm thu
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Dự án
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ngày tải lên
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  Đang tải danh sách biên bản nghiệm thu...
                </td>
              </tr>
            )}
            {!isLoading && filteredMinutes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCheck className="w-10 h-10 text-gray-300" />
                    <p className="font-semibold text-gray-600">Chưa có biên bản nghiệm thu nào</p>
                    <p className="text-xs text-gray-400">Nhấn &quot;Tải lên biên bản&quot; để bổ sung hồ sơ nghiệm thu cho dự án</p>
                  </div>
                </td>
              </tr>
            )}
            {filteredMinutes.map((item) => {
              const Icon = getFileIcon(item.fileUrl, item.name);
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Cột 1: Tên biên bản */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-emerald-50 text-[#006c49] rounded-xl shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <button
                          type="button"
                          onClick={() => setPreviewTarget({ url: item.fileUrl, fileName: item.name })}
                          className="font-semibold text-gray-900 hover:text-[#006c49] truncate block text-left transition-colors"
                          title={item.name}
                        >
                          {item.name}
                        </button>
                        <p className="text-xs text-gray-400 truncate mt-0.5" title={item.fileUrl}>
                          {item.fileUrl}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Dự án */}
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 truncate block max-w-xs" title={item.projectName}>
                      {item.projectName || '—'}
                    </span>
                  </td>

                  {/* Cột 3: Khách hàng */}
                  <td className="px-6 py-4 text-gray-700">
                    <span className="truncate block max-w-[160px]" title={item.customerName}>
                      {item.customerName || '—'}
                    </span>
                  </td>

                  {/* Cột 4: Ngày tải lên */}
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {item.createdAt ? formatDateTime(item.createdAt) : '—'}
                  </td>

                  {/* Cột 5: Hành động */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewTarget({ url: item.fileUrl, fileName: item.name })}
                        className="p-2 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-[#006c49] transition-colors"
                        title="Xem trước tài liệu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Tải về"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal tải lên tài liệu BBNT */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        contracts={contracts}
        initialType="acceptance"
        onSuccess={() => {
          refetch();
          setIsUploadOpen(false);
        }}
      />

      {/* Modal xem trước tài liệu đa năng */}
      <DocumentPreviewModal
        isOpen={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        fileUrl={previewTarget?.url}
        fileName={previewTarget?.fileName}
      />
    </div>
  );
};
