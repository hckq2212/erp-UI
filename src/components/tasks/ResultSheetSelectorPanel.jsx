import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, ListChecks, Loader2, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { SpellCheckWhitelist } from './SpellCheckWhitelist';
import { QcProductInfoPanel } from './QcProductInfoPanel';
import { ScanScopePreviewModal } from './ScanScopePreviewModal';
import {
  useListSpellCheckSheetsMutation,
  useListSpellCheckSheetsFromUrlMutation,
  usePreviewSheetFromUrlMutation,
} from '../../api/spellingCheck';
import { createFileSource } from '../../utils/sheetPreviewSource';
import { MOD_LABEL } from '../../utils/hotkeys';
import { regionRef, scenarioCode } from '../../utils/sheetScope';
import { HelpTip, KeyCombo } from '../ui/HelpTip';

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
  selectedScenarios,
  onSelectedScenariosChange,
  onSelectedScenarioLabelsChange,
  customRegions = [],
  onCustomRegionsChange,
  whitelist,
  onWhitelistChange,
  onLoadingChange,
}) => {
  const [sheets, setSheets] = useState(null);
  const [scenarios, setScenarios] = useState({});
  const [sheetSearch, setSheetSearch] = useState('');
  const [checkedKey, setCheckedKey] = useState(null);
  const [expandedSheet, setExpandedSheet] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const lastSheetRef = useRef(null);

  const [previewSheetFromUrl] = usePreviewSheetFromUrlMutation();
  const [listSheets, { isLoading: isLoadingSheetsFile }] = useListSpellCheckSheetsMutation();
  const [listSheetsFromUrl, { isLoading: isLoadingSheetsUrl }] = useListSpellCheckSheetsFromUrlMutation();

  const isLoadingSheets = isLoadingSheetsFile || isLoadingSheetsUrl;
  const displayName = file?.name || fileName || '';
  const currentKey = file ? `${file.name}:${file.size}` : fileUrl ? fileUrl : null;

  const previewSource = useMemo(() => {
    if (file) return createFileSource(file);
    if (!fileUrl) return null;
    return {
      key: `url:${fileUrl}`,
      load: (request) => previewSheetFromUrl({ fileUrl, fileName, ...request }).unwrap(),
    };
  }, [file, fileUrl, fileName, previewSheetFromUrl]);

  useEffect(() => {
    onLoadingChange?.(Boolean(currentKey) && hasSheets(displayName) && isLoadingSheets);
  }, [currentKey, displayName, isLoadingSheets]);

  useEffect(() => () => onLoadingChange?.(false), []);

  useEffect(() => {
    if (!onSelectedScenarioLabelsChange) return;
    const labelMap = {};
    Object.entries(scenarios).forEach(([sheet, list]) => {
      (list || []).forEach((s) => { labelMap[s.id] = `${sheet} / ${s.scenarioLabel}`; });
    });
    onSelectedScenarioLabelsChange((selectedScenarios || []).map((id) => labelMap[id]).filter(Boolean));
  }, [selectedScenarios, scenarios]);

  const filteredSheets = useMemo(() => {
    if (!sheets) return [];
    const q = sheetSearch.trim().toLowerCase();
    if (!q) return sheets;
    return sheets.filter((name) => name.toLowerCase().includes(q));
  }, [sheets, sheetSearch]);

  const allScenarioIds = (scenarioMap) => Object.values(scenarioMap).flat().map((s) => s.id);
  const sheetScenarioIds = (name) => (scenarios[name] || []).map((s) => s.id);

  useEffect(() => {
    if (currentKey && checkedKey && currentKey !== checkedKey) {
      setCheckedKey(null);
      setSheets(null);
      setScenarios({});
      setSheetSearch('');
      setExpandedSheet(null);
      setIsPreviewOpen(false);
      onSelectedSheetsChange([]);
      onSelectedScenariosChange?.([]);
      onCustomRegionsChange?.([]);
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
        setScenarios(res.scenarios || {});
        onSelectedSheetsChange(res.sheets || []);
        onSelectedScenariosChange?.(allScenarioIds(res.scenarios || {}));
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

  const applySheets = (names, select) => {
    const nameSet = new Set(names);
    const ids = names.flatMap(sheetScenarioIds);
    if (select) {
      onSelectedSheetsChange([...new Set([...selectedSheets, ...names])]);
      onSelectedScenariosChange?.([...new Set([...(selectedScenarios || []), ...ids])]);
      return;
    }
    const idSet = new Set(ids);
    onSelectedSheetsChange(selectedSheets.filter((s) => !nameSet.has(s)));
    onSelectedScenariosChange?.((selectedScenarios || []).filter((id) => !idSet.has(id)));
    onCustomRegionsChange?.(customRegions.filter((r) => !nameSet.has(r.sheet)));
  };

  const toggleSheet = (name) => {
    applySheets([name], !selectedSheets.includes(name));
  };

  const soloSheet = (name) => {
    onSelectedSheetsChange([name]);
    onSelectedScenariosChange?.(sheetScenarioIds(name));
    onCustomRegionsChange?.(customRegions.filter((r) => r.sheet === name));
  };

  const handleSheetClick = (event, name) => {
    const list = filteredSheets;
    const anchor = lastSheetRef.current;
    if (event.shiftKey && anchor && list.includes(anchor) && list.includes(name)) {
      const from = list.indexOf(anchor);
      const to = list.indexOf(name);
      applySheets(list.slice(Math.min(from, to), Math.max(from, to) + 1), !selectedSheets.includes(name));
    } else if (event.ctrlKey || event.metaKey) {
      soloSheet(name);
    } else {
      toggleSheet(name);
    }
    lastSheetRef.current = name;
  };

  const owningSheetOf = (scenarioId) =>
    Object.entries(scenarios).find(([, list]) => (list || []).some((s) => s.id === scenarioId))?.[0];

  const changeScenarios = ({ add = [], remove = [] }) => {
    const current = new Set(selectedScenarios || []);
    remove.forEach((id) => current.delete(id));
    add.forEach((id) => current.add(id));
    onSelectedScenariosChange?.(Array.from(current));
    if (add.length === 0) return;
    const missing = [...new Set(add.map(owningSheetOf).filter(Boolean))].filter((name) => !selectedSheets.includes(name));
    if (missing.length > 0) onSelectedSheetsChange([...selectedSheets, ...missing]);
    const restored = new Set(add);
    if (customRegions.some((r) => restored.has(r.extends))) {
      onCustomRegionsChange?.(customRegions.filter((r) => !restored.has(r.extends)));
    }
  };

  const toggleSelectAll = () => {
    if (selectedSheets.length === sheets.length) {
      onSelectedSheetsChange([]);
      onSelectedScenariosChange?.([]);
      onCustomRegionsChange?.([]);
    } else {
      onSelectedSheetsChange([...sheets]);
      onSelectedScenariosChange?.(allScenarioIds(scenarios));
    }
  };

  const toggleScenario = (scenarioId) => {
    const isSelected = (selectedScenarios || []).includes(scenarioId);
    onSelectedScenariosChange?.(
      isSelected
        ? (selectedScenarios || []).filter((id) => id !== scenarioId)
        : [...(selectedScenarios || []), scenarioId]
    );
    if (!isSelected) {
      const owningSheet = owningSheetOf(scenarioId);
      if (owningSheet && !selectedSheets.includes(owningSheet)) {
        onSelectedSheetsChange([...selectedSheets, owningSheet]);
      }
      if (customRegions.some((r) => r.extends === scenarioId)) {
        onCustomRegionsChange?.(customRegions.filter((r) => r.extends !== scenarioId));
      }
    }
  };

  const ensureSheetSelected = (name) => {
    if (!selectedSheets.includes(name)) onSelectedSheetsChange([...selectedSheets, name]);
  };

  const removeCustomRegion = (id) => {
    const target = customRegions.find((r) => r.id === id);
    onCustomRegionsChange?.(customRegions.filter((r) => r.id !== id));
    if (target?.extends) changeScenarios({ add: [target.extends] });
  };

  const toggleExpandSheet = (name) => {
    setExpandedSheet((prev) => (prev === name ? null : name));
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
        <HelpTip id="sheet-selector" title="Chọn sheet và kịch bản cần quét" align="start">
          <p>Tick các sheet cần kiểm tra chính tả và QC. Bấm vào tên sheet để mở danh sách kịch bản bên trong và bật/tắt từng kịch bản.</p>
          <p>Mỗi kịch bản có một mã định danh (ví dụ R5C1) dùng xuyên suốt khi xem kết quả.</p>
          <p>Cần quét một vài ô hoặc một khối riêng? Mở <b>Xem trước và chọn vùng quét</b> để kéo chọn vùng mới hoặc mở rộng kịch bản có sẵn.</p>
          <p className="pt-1"><KeyCombo keys={['Shift', 'Click']} /> chọn/bỏ cả dải sheet liên tiếp.</p>
          <p><KeyCombo keys={[MOD_LABEL, 'Click']} /> chỉ chọn đúng sheet này.</p>
        </HelpTip>
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
            {filteredSheets.map((name) => {
              const sheetScenarios = scenarios[name] || [];
              const isExpanded = expandedSheet === name;
              const selectedCount = sheetScenarios.filter((s) => (selectedScenarios || []).includes(s.id)).length;
              return (
                <div key={name} className="text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSheets.includes(name)}
                      onChange={() => {}}
                      onClick={(e) => handleSheetClick(e, name)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleExpandSheet(name)}
                      className="flex items-center gap-1.5 flex-1 text-left"
                    >
                      <span>{name}</span>
                      {sheetScenarios.length > 0 && (
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                          {selectedCount}/{sheetScenarios.length} kịch bản
                        </span>
                      )}
                      {sheetScenarios.length > 0 && (
                        isExpanded
                          ? <ChevronUp className="w-3 h-3 text-slate-400" />
                          : <ChevronDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                  {isExpanded && sheetScenarios.length > 0 && (
                    <ul className="ml-6 mt-1 mb-1 space-y-1">
                      {sheetScenarios.map((s) => (
                        <li key={s.id} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <input
                            type="checkbox"
                            className="shrink-0"
                            checked={(selectedScenarios || []).includes(s.id)}
                            onChange={() => toggleScenario(s.id)}
                          />
                          <span className="shrink-0 px-1 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">{scenarioCode(s)}</span>
                          <span className="text-slate-700 font-medium">{s.scenarioLabel}</span>
                          <span className="text-slate-400">
                            (dòng {s.startRow}–{s.endRow})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sheets?.length > 0 && previewSource && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Eye className="w-3.5 h-3.5" />
            Xem trước và chọn vùng quét
          </button>
          <HelpTip id="scope-open-preview" size="md" title="Chọn vùng quét trên bảng" align="start" label="Hướng dẫn chọn vùng quét">
            <p>Mở bảng tính để chọn chính xác phạm vi quét: bật/tắt kịch bản, kéo vùng mới, hoặc mở rộng một kịch bản/vùng sẵn có.</p>
            <p>Trong cửa sổ đó bấm phím <b>?</b> để xem toàn bộ phím tắt.</p>
          </HelpTip>
          {customRegions.length > 0 && (
            <ul className="space-y-1">
              {customRegions.map((region) => (
                <li key={region.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs">
                  <span className="shrink-0 px-1 py-0.5 rounded bg-amber-600 text-[10px] font-bold text-white">{region.id}</span>
                  <span className="font-medium text-slate-700 truncate">{region.label || 'Vùng tự chọn'}</span>
                  <span className="text-slate-400 shrink-0">{regionRef(region)}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomRegion(region.id)}
                    className="ml-auto p-0.5 text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                    aria-label={`Bỏ vùng ${region.label || ''}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sheets?.length === 0 && (
        <div className="text-xs text-slate-400">File này không có sheet nào</div>
      )}

      {sheets?.length > 0 && previewSource && (
        <ScanScopePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Phạm vi quét: ${displayName}`}
          source={previewSource}
          sheets={sheets}
          selectedSheets={selectedSheets}
          scenariosBySheet={scenarios}
          selectedScenarioIds={selectedScenarios || []}
          onToggleScenario={toggleScenario}
          onChangeScenarios={changeScenarios}
          draftRegions={customRegions}
          onDraftRegionsChange={onCustomRegionsChange}
          draftDefinesScope
          onEnsureSheet={ensureSheetSelected}
          footer={
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Xong
            </button>
          }
        />
      )}
    </div>
  );
};