import { useEffect, useState } from 'react';
import { SpellCheck, Download, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import {
  useListSpellCheckSheetsMutation,
  useListSpellCheckSheetsFromUrlMutation,
  useStartSpellCheckMutation,
  useStartSpellCheckFromUrlMutation,
  useGetSpellCheckStatusQuery,
  useDeleteSpellCheckJobMutation,
} from '../../api/spellingCheck';

const SUPPORTED_EXTENSIONS = ['txt', 'csv', 'xlsx', 'xlsm'];
const SHEET_EXTENSIONS = ['xlsx', 'xlsm'];
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '/api';

export const getFileExtension = (name = '') => name.split('.').pop()?.toLowerCase() || '';

export const isSpellCheckSupported = (name = '') => SUPPORTED_EXTENSIONS.includes(getFileExtension(name));

const hasSheets = (name = '') => SHEET_EXTENSIONS.includes(getFileExtension(name));

const MAX_LOCATIONS_SHOWN = 5;

const groupErrors = (errors = []) => {
  const map = new Map();
  for (const err of errors) {
    if (!map.has(err.token)) map.set(err.token, []);
    map.get(err.token).push(err.location);
  }
  return Array.from(map.entries())
    .map(([token, locations]) => ({ token, locations, count: locations.length }))
    .sort((a, b) => b.count - a.count);
};

const formatLocations = (locations) => {
  if (locations.length <= MAX_LOCATIONS_SHOWN) return locations.join(', ');
  const shown = locations.slice(0, MAX_LOCATIONS_SHOWN).join(', ');
  return `${shown} +${locations.length - MAX_LOCATIONS_SHOWN} khác`;
};

export const SpellCheckPanel = ({ file, fileUrl, fileName, onStatusChange }) => {
  const [jobId, setJobId] = useState(null);
  const [lang, setLang] = useState('both');
  const [checkedKey, setCheckedKey] = useState(null);
  const [sheets, setSheets] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);

  const [listSheets, { isLoading: isLoadingSheetsFile }] = useListSpellCheckSheetsMutation();
  const [listSheetsFromUrl, { isLoading: isLoadingSheetsUrl }] = useListSpellCheckSheetsFromUrlMutation();
  const [startSpellCheck, { isLoading: isStartingFile }] = useStartSpellCheckMutation();
  const [startSpellCheckFromUrl, { isLoading: isStartingUrl }] = useStartSpellCheckFromUrlMutation();
  const [deleteSpellCheckJob] = useDeleteSpellCheckJobMutation();

  const isStarting = isStartingFile || isStartingUrl;
  const isLoadingSheets = isLoadingSheetsFile || isLoadingSheetsUrl;

  const displayName = file?.name || fileName || '';
  const currentKey = file ? `${file.name}:${file.size}` : fileUrl ? fileUrl : null;

  const { data: status, error: statusError } = useGetSpellCheckStatusQuery(jobId, {
    skip: !jobId,
    pollingInterval: jobId ? 1500 : 0,
  });

  const isRunning = jobId && (!status || status.status === 'running');

  useEffect(() => {
    if (currentKey && checkedKey && currentKey !== checkedKey) {
      if (jobId) deleteSpellCheckJob(jobId);
      setJobId(null);
      setCheckedKey(null);
      setSheets(null);
      setSelectedSheets([]);
    }
  }, [currentKey, checkedKey]);

  useEffect(() => {
    if (!currentKey || !hasSheets(displayName) || sheets !== null) return;
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
            ? 'Kết nối đến máy chủ kiểm tra chính tả bị gián đoạn, vui lòng thử lại'
            : err?.data?.message || 'Không thể đọc danh sách sheet';
        toast.error(msg);
        setSheets([]);
      }
    };
    load();
  }, [currentKey]);

  useEffect(() => {
    return () => {
      if (jobId) deleteSpellCheckJob(jobId);
    };
  }, []);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status]);

  const toggleSheet = (name) => {
    setSelectedSheets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const toggleSelectAll = () => {
    setSelectedSheets((prev) => (prev.length === sheets.length ? [] : [...sheets]));
  };

  const handleStart = async () => {
    if (!currentKey) return;
    if (hasSheets(displayName) && sheets?.length && selectedSheets.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 sheet');
      return;
    }
    try {
      let res;
      if (file) {
        res = await startSpellCheck({ file, lang, sheetNames: selectedSheets }).unwrap();
      } else {
        res = await startSpellCheckFromUrl({ fileUrl, fileName, lang, sheetNames: selectedSheets }).unwrap();
      }
      setJobId(res.job_id);
      setCheckedKey(currentKey);
    } catch (err) {
      const status = err?.status;
      const msg = status === 413
        ? 'File quá lớn, không thể kiểm tra chính tả'
        : status === 'TIMEOUT_ERROR' || status === 'FETCH_ERROR'
          ? 'Kết nối đến máy chủ kiểm tra chính tả bị gián đoạn, vui lòng thử lại'
          : err?.data?.message || 'Không thể bắt đầu kiểm tra chính tả';
      toast.error(msg);
    }
  };

  const handleCancel = async () => {
    if (jobId) await deleteSpellCheckJob(jobId);
    setJobId(null);
    setCheckedKey(null);
  };

  const errorCount = status?.errors?.length || 0;

  if (!currentKey || !isSpellCheckSupported(displayName)) return null;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <SpellCheck className="w-4 h-4" />
          Kiểm tra chính tả
        </div>
        {!jobId && (
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1"
          >
            <option value="both">Việt + Anh</option>
            <option value="vi">Tiếng Việt</option>
            <option value="en">Tiếng Anh</option>
          </select>
        )}
      </div>

      {!jobId && hasSheets(displayName) && (
        <div className="space-y-1.5">
          {isLoadingSheets && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đọc danh sách sheet...
            </div>
          )}
          {sheets?.length > 0 && (
            <div className="border border-slate-200 rounded-xl bg-white p-2 max-h-32 overflow-y-auto space-y-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 pb-1 border-b border-slate-100">
                <input
                  type="checkbox"
                  checked={selectedSheets.length === sheets.length}
                  onChange={toggleSelectAll}
                />
                Chọn tất cả ({sheets.length} sheet)
              </label>
              {sheets.map((name) => (
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
          )}
        </div>
      )}

      {!jobId && !isLoadingSheets && (
        <Button type="button" variant="outline" size="sm" isLoading={isStarting} onClick={handleStart}>
          Kiểm tra chính tả file này
        </Button>
      )}

      {isRunning && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang kiểm tra{status?.total ? ` (${status.processed}/${status.total})` : '...'}
          </div>
          {status?.total > 0 && (
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(((status.processed || 0) / status.total) * 100))}%` }}
              />
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Hủy kiểm tra
          </Button>
        </div>
      )}

      {status?.status === 'error' && (
        <div className="flex items-center justify-between gap-2 text-xs text-red-600">
          {status.error || statusError?.data?.message || 'Lỗi khi kiểm tra chính tả'}
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Thử lại
          </Button>
        </div>
      )}

      {status?.status === 'done' && (
        <div className="space-y-2">
          <div className={`text-xs font-bold ${errorCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {errorCount > 0 ? `Phát hiện ${errorCount} lỗi chính tả` : 'Không phát hiện lỗi chính tả'}
          </div>
          {errorCount > 0 && (
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y">
              {groupErrors(status.errors).slice(0, 100).map((group) => (
                <div key={group.token} className="px-3 py-1.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700 font-medium truncate">{group.token}</span>
                    <span className="text-slate-400 font-mono shrink-0">x{group.count}</span>
                  </div>
                  <div className="text-slate-400 font-mono truncate">{formatLocations(group.locations)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <a
                href={`${BASE_URL}/spelling-check/${jobId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Tải báo cáo PDF
              </a>
            )}
            <button type="button" onClick={handleCancel} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" /> Kiểm tra lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};