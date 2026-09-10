import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Download, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import { QcProductInfoPanel } from './QcProductInfoPanel';
import {
  useListQcSheetsMutation,
  useListQcSheetsFromUrlMutation,
  useRunQcMutation,
} from '../../api/qc';

const SHEET_EXTENSIONS = ['xlsx', 'xlsm'];
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '/api';

export const getFileExtension = (name = '') => name.split('.').pop()?.toLowerCase() || '';

export const isQcSupported = (name = '') => SHEET_EXTENSIONS.includes(getFileExtension(name));

export const QCPanel = ({ file, fileUrl, fileName, projectId, onStatusChange }) => {
  const [sheets, setSheets] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [sheetSearch, setSheetSearch] = useState('');
  const [checkedKey, setCheckedKey] = useState(null);
  const [report, setReport] = useState(null);

  const [listSheets, { isLoading: isLoadingSheetsFile }] = useListQcSheetsMutation();
  const [listSheetsFromUrl, { isLoading: isLoadingSheetsUrl }] = useListQcSheetsFromUrlMutation();
  const [runQc, { isLoading: isRunning }] = useRunQcMutation();

  const isLoadingSheets = isLoadingSheetsFile || isLoadingSheetsUrl;
  const displayName = file?.name || fileName || '';
  const currentKey = file ? `${file.name}:${file.size}` : fileUrl ? fileUrl : null;
  const mismatches = report?.mismatch_report?.mismatches || [];

  const filteredSheets = useMemo(() => {
    if (!sheets) return [];
    const q = sheetSearch.trim().toLowerCase();
    if (!q) return sheets;
    return sheets.filter((name) => name.toLowerCase().includes(q));
  }, [sheets, sheetSearch]);

  useEffect(() => {
    if (currentKey && checkedKey && currentKey !== checkedKey) {
      setCheckedKey(null);
      setSheets(null);
      setSelectedSheets([]);
      setSheetSearch('');
      setReport(null);
    }
  }, [currentKey, checkedKey]);

  useEffect(() => {
    if (!currentKey || !isQcSupported(displayName) || sheets !== null) return;
    const load = async () => {
      try {
        const res = file
          ? await listSheets({ file }).unwrap()
          : await listSheetsFromUrl({ fileUrl, fileName }).unwrap();
        setSheets(res.sheets || []);
        setSelectedSheets(res.sheets || []);
      } catch (err) {
        const status = err?.status;
        const msg = status === 413
          ? 'File quá lớn, không thể đọc danh sách sheet'
          : status === 'TIMEOUT_ERROR' || status === 'FETCH_ERROR'
            ? 'Kết nối đến máy chủ QC bị gián đoạn, vui lòng thử lại'
            : err?.data?.message || 'Không thể đọc danh sách sheet';
        toast.error(msg);
        setSheets([]);
      }
    };
    load();
  }, [currentKey]);

  useEffect(() => {
    onStatusChange?.(report ? { mismatchCount: mismatches.length } : null);
  }, [report]);

  const toggleSheet = (name) => {
    setSelectedSheets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const toggleSelectAll = () => {
    setSelectedSheets((prev) => (prev.length === sheets.length ? [] : [...sheets]));
  };

  const handleRun = async () => {
    if (!currentKey || selectedSheets.length === 0 || !projectId) return;
    try {
      const res = file
        ? await runQc({ file, sheetNames: selectedSheets, projectId }).unwrap()
        : await runQc({ fileUrl, fileName, sheetNames: selectedSheets, projectId }).unwrap();
      setReport(res);
      setCheckedKey(currentKey);
    } catch (err) {
      const status = err?.status;
      const msg = status === 400
        ? err?.data?.message || 'Dự án chưa có thông tin chuẩn sản phẩm được duyệt'
        : status === 'TIMEOUT_ERROR' || status === 'FETCH_ERROR'
          ? 'Kết nối đến máy chủ QC bị gián đoạn, vui lòng thử lại'
          : err?.data?.message || 'Không thể chạy QC';
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setReport(null);
    setCheckedKey(null);
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetch(`${BASE_URL}/qc/report-pdf`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mismatches,
          sheets: selectedSheets,
          fileName: displayName || undefined,
        }),
      });
      if (!res.ok) throw new Error('Không thể tải báo cáo PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qc_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải báo cáo PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!currentKey || !isQcSupported(displayName)) return null;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <ClipboardCheck className="w-4 h-4" />
        QC đối chiếu sản phẩm
      </div>

      <QcProductInfoPanel projectId={projectId} />

      {!report && (
        <div className="space-y-1.5">
          {isLoadingSheets && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đọc danh sách sheet...
            </div>
          )}
          {sheets?.length > 0 && (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sheetSearch}
                  onChange={(e) => setSheetSearch(e.target.value)}
                  placeholder="Tìm sheet..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border border-slate-200 rounded-xl bg-white p-2 max-h-32 overflow-y-auto space-y-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 pb-1 border-b border-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedSheets.length === sheets.length}
                    onChange={toggleSelectAll}
                  />
                  Chọn tất cả ({sheets.length} sheet)
                </label>
                {filteredSheets.length === 0 && (
                  <div className="text-xs text-slate-400 py-1">Không tìm thấy sheet phù hợp</div>
                )}
                {filteredSheets.map((name) => (
                  <label key={name} className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedSheets.includes(name)}
                      onChange={() => toggleSheet(name)}
                    />
                    {name}
                  </label>
                ))}
              </div>
            </>
          )}
          {sheets?.length === 0 && (
            <div className="text-xs text-slate-400">File này không có sheet để chạy QC</div>
          )}
        </div>
      )}

      {!report && !isLoadingSheets && sheets?.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isRunning}
          disabled={selectedSheets.length === 0}
          onClick={handleRun}
        >
          Chạy QC {selectedSheets.length > 1 ? `${selectedSheets.length} sheet` : 'sheet này'}
        </Button>
      )}

      {report && (
        <div className="space-y-2">
          <div className={`text-xs font-bold ${mismatches.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {mismatches.length > 0 ? `Phát hiện ${mismatches.length} điểm chưa khớp` : 'Không phát hiện điểm chưa khớp'}
          </div>
          {mismatches.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y">
              {mismatches.map((m, idx) => (
                <div key={idx} className="px-3 py-1.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700 font-medium truncate">
                      {m.sheet_name ? `${m.sheet_name} · ` : ''}{m.product_ref || 'Không rõ sản phẩm'} · {m.attribute}
                    </span>
                    <span className="text-slate-400 font-mono shrink-0">
                      R{m.row_range?.[0]}-{m.row_range?.[1]}
                    </span>
                  </div>
                  <div className="text-slate-500">{m.claimed_value} → {m.expected_value ?? 'không tìm thấy'}</div>
                  <div className="text-slate-400 italic">{m.reasoning}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Tải báo cáo PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
            >
              Chạy lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
