import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, Eye, MousePointerClick, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SheetGridPreview } from './SheetGridPreview';
import {
  buildQcRowSet,
  buildSpellCellMap,
  computeActiveAreas,
  createRegion,
  parseRangeInput,
  regionCellCount,
  regionRange,
} from '../../utils/sheetScope';

const MAX_REGIONS = 50;

const TOOL_LABELS = {
  scenario: { label: 'Chọn kịch bản', icon: MousePointerClick },
  region: { label: 'Vẽ vùng', icon: Crosshair },
  view: { label: 'Chỉ xem', icon: Eye },
};

const Swatch = ({ className, children }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
    <span className={cn('w-3.5 h-3.5 rounded border border-slate-300', className)} />
    {children}
  </span>
);

export const ScanScopePreviewModal = ({
  isOpen,
  onClose,
  title = 'Xem trước phạm vi quét',
  source,
  sheets = [],
  selectedSheets = null,
  scenariosBySheet = {},
  selectedScenarioIds = null,
  onToggleScenario,
  fixedRegions = [],
  draftRegions = [],
  onDraftRegionsChange,
  draftDefinesScope = false,
  onEnsureSheet,
  defaultTool,
  spellItems,
  qcItems,
  focus = null,
  showScanState = true,
  footer,
}) => {
  const availableTools = useMemo(() => {
    const tools = [];
    if (onToggleScenario) tools.push('scenario');
    if (onDraftRegionsChange) tools.push('region');
    tools.push('view');
    return tools;
  }, [onToggleScenario, onDraftRegionsChange]);

  const [activeSheet, setActiveSheet] = useState(null);
  const [tool, setTool] = useState(defaultTool && availableTools.includes(defaultTool) ? defaultTool : availableTools[0]);
  const [rangeText, setRangeText] = useState('');
  const [notice, setNotice] = useState('');
  const [localFocus, setLocalFocus] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveSheet((prev) => (prev && sheets.includes(prev) ? prev : sheets[0] || null));
  }, [isOpen, sheets]);

  useEffect(() => {
    if (!isOpen || !focus) return;
    if (focus.sheet && sheets.includes(focus.sheet)) setActiveSheet(focus.sheet);
    setLocalFocus(focus);
  }, [isOpen, focus?.nonce]);

  useEffect(() => {
    if (!availableTools.includes(tool)) setTool(defaultTool && availableTools.includes(defaultTool) ? defaultTool : availableTools[0]);
  }, [availableTools, tool]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const fallbackSheet = sheets.length === 1 ? sheets[0] : null;
  const sheetScenarios = scenariosBySheet[activeSheet] || [];
  const sheetFixed = useMemo(() => fixedRegions.filter((r) => r.sheet === activeSheet), [fixedRegions, activeSheet]);
  const sheetDraft = useMemo(() => draftRegions.filter((r) => r.sheet === activeSheet), [draftRegions, activeSheet]);

  const areas = useMemo(
    () =>
      computeActiveAreas({
        scenarios: sheetScenarios,
        selectedScenarioIds,
        regions: draftDefinesScope ? [...sheetFixed, ...sheetDraft] : sheetFixed,
      }),
    [sheetScenarios, selectedScenarioIds, sheetFixed, sheetDraft, draftDefinesScope]
  );

  const spellCells = useMemo(
    () => buildSpellCellMap(spellItems, activeSheet, fallbackSheet),
    [spellItems, activeSheet, fallbackSheet]
  );
  const qcRows = useMemo(() => buildQcRowSet(qcItems, activeSheet), [qcItems, activeSheet]);

  const selectedSet = useMemo(() => (selectedScenarioIds ? new Set(selectedScenarioIds) : null), [selectedScenarioIds]);
  const totalRegions = fixedRegions.length + draftRegions.length;

  const addRegion = (bounds) => {
    if (!onDraftRegionsChange) return;
    if (totalRegions >= MAX_REGIONS) {
      setNotice(`Chỉ được chọn tối đa ${MAX_REGIONS} vùng`);
      return;
    }
    setNotice('');
    onEnsureSheet?.(bounds.sheet);
    onDraftRegionsChange([...draftRegions, createRegion(bounds, [...fixedRegions, ...draftRegions])]);
  };

  const handleAddRange = (event) => {
    event.preventDefault();
    const bounds = parseRangeInput(rangeText, activeSheet);
    if (!bounds || !sheets.includes(bounds.sheet)) {
      setNotice('Vùng không hợp lệ, hãy nhập dạng A1:D20 hoặc Sheet1!A1:D20');
      return;
    }
    addRegion(bounds);
    setRangeText('');
    setLocalFocus({ sheet: bounds.sheet, row: bounds.startRow, col: bounds.startCol, nonce: Date.now() });
  };

  const updateRegion = (id, patch) => {
    onDraftRegionsChange?.(draftRegions.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRegion = (id) => {
    onDraftRegionsChange?.(draftRegions.filter((r) => r.id !== id));
  };

  const focusRegion = (region) => {
    setActiveSheet(region.sheet);
    setLocalFocus({ sheet: region.sheet, row: region.startRow, col: region.startCol, nonce: Date.now() });
  };

  const focusScenario = (scenario) => {
    setLocalFocus({ sheet: scenario.sheet, row: scenario.startRow, col: (scenario.colStart ?? 0) + 1, nonce: Date.now() });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black/50 p-2 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[98vw] h-[96vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {sheets.map((name) => {
                  const included = !selectedSheets || selectedSheets.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={name === activeSheet}
                      onClick={() => setActiveSheet(name)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500',
                        name === activeSheet
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
                        !included && name !== activeSheet && 'text-slate-400'
                      )}
                    >
                      {name}
                      {!included && <span className="ml-1 text-[10px] opacity-70">(chưa chọn)</span>}
                    </button>
                  );
                })}
              </div>
              {availableTools.length > 1 && (
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                  {availableTools.map((key) => {
                    const Icon = TOOL_LABELS[key].icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTool(key)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500',
                          tool === key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {TOOL_LABELS[key].label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <SheetGridPreview
              source={source}
              sheet={activeSheet}
              scenarios={sheetScenarios}
              selectedScenarioIds={selectedScenarioIds}
              fixedRegions={sheetFixed}
              draftRegions={sheetDraft}
              spellCells={spellCells}
              qcRows={qcRows}
              areas={areas}
              showScanState={showScanState}
              tool={tool}
              focus={localFocus}
              onToggleScenario={onToggleScenario}
              onDrawRegion={addRegion}
            />

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Swatch className="bg-blue-50">Kịch bản được quét</Swatch>
              <Swatch className="bg-slate-100">Kịch bản bỏ qua</Swatch>
              <Swatch className="bg-violet-100">Vùng tự chọn đã nộp</Swatch>
              {onDraftRegionsChange && <Swatch className="bg-amber-100">Vùng đang chọn</Swatch>}
              {spellItems && <Swatch className="bg-yellow-200">Lỗi chính tả</Swatch>}
              {qcItems && <Swatch className="bg-red-100">Dòng có điểm QC chưa khớp</Swatch>}
              {showScanState && <span className="text-[11px] text-slate-400">Chữ mờ là ô không bị quét</span>}
            </div>
          </div>

          <aside className="w-72 shrink-0 border-l border-slate-200 p-4 overflow-y-auto space-y-5">
            {sheetScenarios.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700">Kịch bản trong sheet ({sheetScenarios.length})</h4>
                <ul className="space-y-1">
                  {sheetScenarios.map((scenario) => {
                    const checked = selectedSet ? selectedSet.has(scenario.id) : true;
                    return (
                      <li key={scenario.id} className="flex items-center gap-2 text-xs">
                        {onToggleScenario ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleScenario(scenario.id)}
                            aria-label={`Quét kịch bản ${scenario.scenarioLabel}`}
                          />
                        ) : (
                          <span className={cn('w-2 h-2 rounded-full shrink-0', checked ? 'bg-blue-500' : 'bg-slate-300')} />
                        )}
                        <button
                          type="button"
                          onClick={() => focusScenario(scenario)}
                          className="flex-1 min-w-0 text-left truncate text-slate-700 hover:text-blue-700"
                          title={scenario.scenarioLabel}
                        >
                          {scenario.scenarioLabel}
                        </button>
                        <span className="text-slate-400 shrink-0">
                          {scenario.startRow}–{scenario.endRow}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700">Vùng tự chọn ({totalRegions})</h4>
              {totalRegions === 0 && (
                <p className="text-xs text-slate-400">
                  {onDraftRegionsChange ? 'Chưa có vùng nào. Chọn công cụ Vẽ vùng rồi kéo trên bảng, hoặc nhập toạ độ bên dưới.' : 'Không có vùng tự chọn.'}
                </p>
              )}
              <ul className="space-y-2">
                {fixedRegions.map((region) => (
                  <li key={`${region.sheet}:${region.id}`} className="p-2 border border-violet-200 bg-violet-50 rounded-lg text-xs space-y-0.5">
                    <button type="button" onClick={() => focusRegion(region)} className="font-medium text-slate-800 hover:text-blue-700 text-left">
                      {region.label || 'Vùng tự chọn'}
                    </button>
                    <div className="text-slate-500">
                      {region.sheet}!{regionRange(region)} · {regionCellCount(region)} ô{region.qc === false ? ' · không QC' : ''}
                    </div>
                  </li>
                ))}
                {draftRegions.map((region) => (
                  <li key={`${region.sheet}:${region.id}`} className="p-2 border border-amber-200 bg-amber-50 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={region.label}
                        onChange={(e) => updateRegion(region.id, { label: e.target.value.slice(0, 100) })}
                        className="flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Tên vùng"
                      />
                      <button
                        type="button"
                        onClick={() => removeRegion(region.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label="Xoá vùng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button type="button" onClick={() => focusRegion(region)} className="text-slate-500 hover:text-blue-700 text-left">
                      {region.sheet}!{regionRange(region)} · {regionCellCount(region)} ô
                    </button>
                    <label className="flex items-center gap-1.5 text-slate-600">
                      <input type="checkbox" checked={region.qc !== false} onChange={(e) => updateRegion(region.id, { qc: e.target.checked })} />
                      Đối chiếu QC cho vùng này
                    </label>
                  </li>
                ))}
              </ul>

              {onDraftRegionsChange && (
                <form onSubmit={handleAddRange} className="flex gap-1.5">
                  <input
                    type="text"
                    value={rangeText}
                    onChange={(e) => setRangeText(e.target.value)}
                    placeholder="A1:D20"
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Nhập toạ độ vùng"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Thêm
                  </button>
                </form>
              )}
              {notice && <p className="text-xs text-red-600">{notice}</p>}
            </section>
          </aside>
        </div>

        {footer && <div className="px-5 py-3 border-t border-slate-200 shrink-0 flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
