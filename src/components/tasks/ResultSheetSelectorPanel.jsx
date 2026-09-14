import { useEffect, useMemo, useState } from 'react';
import { ListChecks, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { SpellCheckWhitelist } from './SpellCheckWhitelist';
import { QcProductInfoPanel } from './QcProductInfoPanel';
import {
  useListSpellCheckSheetsMutation,
  useListSpellCheckSheetsFromUrlMutation,
} from '../../api/spellingCheck';

const SHEET_EXTENSIONS = ['xlsx', 'xlsm'];

const getFileExtension = (name = '') => name.split('.').pop()?.toLowerCase() || '';
const hasSheets = (name = '') => SHEET_EXTENSIONS.includes(getFileExtension(name));

export const ResultSheetSelectorPanel = ({
  file,
  fileUrl,
  fileName,
  projectId,
  selectedSheets,
  onSelectedSheetsChange,
  whitelist,
  onWhitelistChange,
}) => {
  const [sheets, setSheets] = useState(null);
  const [sheetSearch, setSheetSearch] = useState('');
  const [checkedKey, setCheckedKey] = useState(null);

  const [listSheets, { isLoading: isLoadingSheetsFile }] = useListSpellCheckSheetsMutation();
  const [listSheetsFromUrl, { isLoading: isLoadingSheetsUrl }] = useListSpellCheckSheetsFromUrlMutation();

  const isLoadingSheets = isLoadingSheetsFile || isLoadingSheetsUrl;
  const displayName = file?.name || fileName || '';
  const currentKey = file ? `${file.name}:${file.size}` : fileUrl ? fileUrl : null;

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
      setSheetSearch('');
      onSelectedSheetsChange([]);
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
        onSelectedSheetsChange(res.sheets || []);
        setCheckedKey(currentKey);
      } catch (err) {
        const status = err?.status;
        const msg = status === 413
          ? 'File quá lớn, không thể đọc danh sách sheet'
          : status === 'TIMEOUT_ERROR' || status === 'FETCH_ERROR'
            ? 'Kết nối đến máy chủ kiểm tra bị gián đoạn, vui lòng thử lại'
            : err?.data?.message || 'Không thể đọc danh sách sheet';
        toast.error(msg);
        setSheets([]);
      }
    };
    load();
  }, [currentKey]);

  const toggleSheet = (name) => {
    onSelectedSheetsChange(
      selectedSheets.includes(name) ? selectedSheets.filter((s) => s !== name) : [...selectedSheets, name]
    );
  };

  const toggleSelectAll = () => {
    onSelectedSheetsChange(selectedSheets.length === sheets.length ? [] : [...sheets]);
  };

  if (!currentKey) return null;

  if (!hasSheets(displayName)) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
        File này không hỗ trợ chọn sheet, sẽ được nộp mà không tự động kiểm tra chính tả/QC.
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <ListChecks className="w-4 h-4" />
        Chọn sheet
      </div>

      <SpellCheckWhitelist whitelist={whitelist} onChange={onWhitelistChange} />
      <QcProductInfoPanel projectId={projectId} />

      {isLoadingSheets && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đọc danh sách sheet...
        </div>
      )}

      {sheets?.length > 0 && (
        <div className="space-y-1.5">
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
          <div className="border border-slate-200 rounded-xl bg-white p-2 max-h-40 overflow-y-auto space-y-1">
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
        </div>
      )}

      {sheets?.length === 0 && (
        <div className="text-xs text-slate-400">File này không có sheet nào</div>
      )}
    </div>
  );
};
