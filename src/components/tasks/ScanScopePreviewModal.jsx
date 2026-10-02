import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, Eye, Keyboard, Maximize2, MousePointerClick, Plus, Redo2, Trash2, Undo2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MOD_LABEL, hasMod, isTypingTarget } from '../../utils/hotkeys';
import { HelpTip, KeyCombo, Kbd } from '../ui/HelpTip';
import { SheetGridPreview } from './SheetGridPreview';
import {
  boundsOfScenario,
  buildQcRowSet,
  buildSpellCellMap,
  cellInBounds,
  computeActiveAreas,
  createRegion,
  parseRangeInput,
  regionCellCount,
  regionRange,
  scenarioCode,
  scenarioFiniteBounds,
  unionBounds,
} from '../../utils/sheetScope';

const MAX_REGIONS = 50;
const MAX_HISTORY = 50;

const TOOL_LABELS = {
  scenario: { label: 'Chọn kịch bản', icon: MousePointerClick, key: '1' },
  region: { label: 'Vẽ vùng', icon: Crosshair, key: '2' },
  view: { label: 'Chỉ xem', icon: Eye, key: '3' },
};

const DRAW_MODES = {
  new: { label: 'Vùng mới', icon: Plus, key: 'N' },
  expand: { label: 'Mở rộng vùng', icon: Maximize2, key: 'E' },
};

const SHORTCUTS = [
  { keys: ['1', '2', '3'], joiner: '/', text: 'Chuyển công cụ: chọn kịch bản, vẽ vùng, chỉ xem' },
  { keys: ['N'], text: 'Chế độ vẽ: tạo vùng mới' },
  { keys: ['E'], text: 'Chế độ vẽ: mở rộng vùng đang chọn' },
  { keys: ['Shift', 'Kéo'], text: 'Tạm thời mở rộng: vùng đang chọn, hoặc vùng/kịch bản nơi bắt đầu kéo' },
  { keys: [MOD_LABEL, 'Kéo'], text: 'Luôn tạo vùng mới, kể cả khi đang ở chế độ mở rộng' },
  { keys: ['Click'], text: 'Công cụ vẽ vùng: bấm vào vùng có sẵn để chọn nó' },
  { keys: ['Shift', 'Click'], text: 'Công cụ chọn kịch bản: chọn/bỏ cả dải kịch bản liên tiếp' },
  { keys: [MOD_LABEL, 'Click'], text: 'Công cụ chọn kịch bản: chỉ giữ lại kịch bản này trong sheet' },
  { keys: [MOD_LABEL, 'A'], text: 'Chọn tất cả kịch bản của sheet (thêm Shift để bỏ chọn tất cả)' },
  { keys: [MOD_LABEL, 'Z'], text: 'Hoàn tác thao tác vùng' },
  { keys: [MOD_LABEL, 'Shift', 'Z'], text: `Làm lại (hoặc ${MOD_LABEL}+Y)` },
  { keys: ['Del'], text: 'Xoá vùng đang chọn' },
  { keys: ['Alt', '← →'], text: 'Chuyển sang sheet trước/sau' },
  { keys: ['?'], text: 'Mở/đóng bảng phím tắt' },
  { keys: ['Esc'], text: 'Bỏ chọn vùng, bấm tiếp để đóng cửa sổ' },
];

const Swatch = ({ className, children }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
    <span className={cn('w-3.5 h-3.5 rounded border border-slate-300', className)} />
    {children}
  </span>
);

const CodeBadge = ({ children, tone = 'blue' }) => (
  <span
    className={cn(
      'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white',
      tone === 'blue' && 'bg-blue-600',
      tone === 'amber' && 'bg-amber-600',
      tone === 'violet' && 'bg-violet-600',
      tone === 'slate' && 'bg-slate-500'
    )}
  >
    {children}
  </span>
);

const RangeField = ({ region, onCommit }) => {
  const current = regionRange(region);
  const [text, setText] = useState(current);

  useEffect(() => {
    setText(current);
  }, [current]);

  const commit = () => {
    const value = text.trim();
    if (!value || value.toUpperCase() === current) {
      setText(current);
      return;
    }
    if (!onCommit(region, value)) setText(current);
  };

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
      className="w-28 px-2 py-1 font-mono text-[11px] border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Toạ độ vùng, sửa để mở rộng hoặc thu hẹp"
    />
  );
};

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
  onChangeScenarios,
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
  const [drawMode, setDrawMode] = useState('new');
  const [activeRegionId, setActiveRegionId] = useState(null);
  const [held, setHeld] = useState({ shift: false, mod: false });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [rangeText, setRangeText] = useState('');
  const [notice, setNotice] = useState('');
  const [localFocus, setLocalFocus] = useState(null);

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const lastScenarioRef = useRef(null);
  const keyHandlerRef = useRef(null);

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
    if (isOpen) return;
    undoStack.current = [];
    redoStack.current = [];
    setActiveRegionId(null);
    setShowShortcuts(false);
    setNotice('');
  }, [isOpen]);

  const fallbackSheet = sheets.length === 1 ? sheets[0] : null;
  const sheetScenarios = scenariosBySheet[activeSheet] || [];
  const visibleFixed = useMemo(
    () => fixedRegions.filter((f) => !draftRegions.some((d) => d.sheet === f.sheet && d.id === f.id)),
    [fixedRegions, draftRegions]
  );
  const sheetFixed = useMemo(() => visibleFixed.filter((r) => r.sheet === activeSheet), [visibleFixed, activeSheet]);
  const sheetDraft = useMemo(() => draftRegions.filter((r) => r.sheet === activeSheet), [draftRegions, activeSheet]);
  const everyRegion = useMemo(() => [...fixedRegions, ...draftRegions], [fixedRegions, draftRegions]);

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
  const totalRegions = visibleFixed.length + draftRegions.length;
  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;
  const canDraw = Boolean(onDraftRegionsChange);

  const effectiveMode = held.mod ? 'new' : held.shift ? 'expand' : drawMode;

  const syncExtends = useCallback(
    (prev, next) => {
      if (!onChangeScenarios) return;
      const before = new Set(prev.map((r) => r.extends).filter(Boolean));
      const after = new Set(next.map((r) => r.extends).filter(Boolean));
      const add = [...before].filter((id) => !after.has(id));
      const remove = [...after].filter((id) => !before.has(id));
      if (add.length || remove.length) onChangeScenarios({ add, remove });
    },
    [onChangeScenarios]
  );

  const commitRegions = useCallback(
    (next) => {
      undoStack.current = [...undoStack.current.slice(-(MAX_HISTORY - 1)), draftRegions];
      redoStack.current = [];
      syncExtends(draftRegions, next);
      onDraftRegionsChange?.(next);
    },
    [draftRegions, onDraftRegionsChange, syncExtends]
  );

  const undo = useCallback(() => {
    const previous = undoStack.current[undoStack.current.length - 1];
    if (!previous || !onDraftRegionsChange) return;
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, draftRegions];
    syncExtends(draftRegions, previous);
    onDraftRegionsChange(previous);
  }, [draftRegions, onDraftRegionsChange, syncExtends]);

  const redo = useCallback(() => {
    const next = redoStack.current[redoStack.current.length - 1];
    if (!next || !onDraftRegionsChange) return;
    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [...undoStack.current, draftRegions];
    syncExtends(draftRegions, next);
    onDraftRegionsChange(next);
  }, [draftRegions, onDraftRegionsChange, syncExtends]);

  const regionAt = (row, col) => {
    const candidates = [...sheetDraft, ...sheetFixed].filter((r) => cellInBounds(r, row, col));
    return candidates.find((r) => r.id === activeRegionId) || candidates[0] || null;
  };

  const scenarioAt = (row, col) => sheetScenarios.find((s) => cellInBounds(boundsOfScenario(s), row, col)) || null;

  const addRegion = (bounds, extra = {}) => {
    if (!canDraw) return null;
    if (totalRegions >= MAX_REGIONS) {
      setNotice(`Chỉ được chọn tối đa ${MAX_REGIONS} vùng`);
      return null;
    }
    setNotice('');
    onEnsureSheet?.(bounds.sheet);
    const region = createRegion(bounds, everyRegion, extra);
    commitRegions([...draftRegions, region]);
    setActiveRegionId(region.id);
    return region;
  };

  const expandTarget = (meta) => {
    const active = [...sheetDraft, ...sheetFixed].find((r) => r.id === activeRegionId);
    if (active) return { kind: 'region', region: active };
    const region = regionAt(meta.startRow, meta.startCol);
    if (region) return { kind: 'region', region };
    const scenario = scenarioAt(meta.startRow, meta.startCol);
    if (scenario) return { kind: 'scenario', scenario };
    return null;
  };

  const expandRegion = (bounds, meta) => {
    const target = expandTarget(meta);
    if (!target) {
      setNotice('Chưa có vùng để mở rộng. Hãy chọn một vùng, hoặc bắt đầu kéo từ bên trong vùng/kịch bản cần mở rộng.');
      return;
    }
    setNotice('');
    if (target.kind === 'region') {
      const merged = { ...target.region, ...unionBounds(target.region, bounds) };
      const isDraft = draftRegions.some((r) => r.sheet === merged.sheet && r.id === merged.id);
      commitRegions(
        isDraft
          ? draftRegions.map((r) => (r.sheet === merged.sheet && r.id === merged.id ? merged : r))
          : [...draftRegions, merged]
      );
      setActiveRegionId(merged.id);
      return;
    }
    const base = scenarioFiniteBounds(target.scenario, bounds.endCol);
    const merged = { sheet: bounds.sheet, ...unionBounds(base, bounds) };
    const created = addRegion(merged, { label: target.scenario.scenarioLabel, extends: target.scenario.id });
    if (created) setLocalFocus({ sheet: merged.sheet, row: merged.startRow, col: merged.startCol, nonce: Date.now() });
  };

  const handleDraw = (bounds, meta = {}) => {
    const mode = meta.mod ? 'new' : meta.shift ? 'expand' : drawMode;
    if (meta.single && !meta.shift && !meta.mod) {
      const hit = regionAt(meta.startRow, meta.startCol);
      if (hit) {
        setActiveRegionId(hit.id);
        setNotice('');
        return;
      }
    }
    if (mode === 'expand') {
      expandRegion(bounds, meta);
      return;
    }
    addRegion(bounds);
  };

  const handleAddRange = (event) => {
    event.preventDefault();
    const bounds = parseRangeInput(rangeText, activeSheet);
    if (!bounds || !sheets.includes(bounds.sheet)) {
      setNotice('Vùng không hợp lệ, hãy nhập dạng A1:D20 hoặc Sheet1!A1:D20');
      return;
    }
    if (addRegion(bounds)) {
      setRangeText('');
      setLocalFocus({ sheet: bounds.sheet, row: bounds.startRow, col: bounds.startCol, nonce: Date.now() });
    }
  };

  const updateRegion = (id, patch) => {
    onDraftRegionsChange?.(draftRegions.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const commitRegionRange = (region, text) => {
    const bounds = parseRangeInput(text, region.sheet);
    if (!bounds) {
      setNotice('Toạ độ không hợp lệ, hãy nhập dạng A1:D20');
      return false;
    }
    setNotice('');
    const { startRow, endRow, startCol, endCol } = bounds;
    commitRegions(
      draftRegions.map((r) => (r.sheet === region.sheet && r.id === region.id ? { ...r, startRow, endRow, startCol, endCol } : r))
    );
    return true;
  };

  const removeRegion = (region) => {
    commitRegions(draftRegions.filter((r) => !(r.sheet === region.sheet && r.id === region.id)));
    if (activeRegionId === region.id) setActiveRegionId(null);
  };

  const focusRegion = (region) => {
    setActiveSheet(region.sheet);
    setActiveRegionId(region.id);
    setLocalFocus({ sheet: region.sheet, row: region.startRow, col: region.startCol, nonce: Date.now() });
  };

  const focusScenario = (scenario) => {
    setLocalFocus({ sheet: scenario.sheet, row: scenario.startRow, col: (scenario.colStart ?? 0) + 1, nonce: Date.now() });
  };

  const handleScenarioClick = (id, mods = {}) => {
    if (!onToggleScenario) return;
    const ids = sheetScenarios.map((s) => s.id);
    const isSelected = selectedSet ? selectedSet.has(id) : true;
    if (mods.mod && onChangeScenarios) {
      onChangeScenarios({ add: [id], remove: ids.filter((x) => x !== id) });
      lastScenarioRef.current = id;
      return;
    }
    if (mods.shift && onChangeScenarios && lastScenarioRef.current && ids.includes(lastScenarioRef.current)) {
      const from = ids.indexOf(lastScenarioRef.current);
      const to = ids.indexOf(id);
      const range = ids.slice(Math.min(from, to), Math.max(from, to) + 1);
      onChangeScenarios(isSelected ? { remove: range } : { add: range });
      lastScenarioRef.current = id;
      return;
    }
    onToggleScenario(id);
    lastScenarioRef.current = id;
  };

  const selectAllScenarios = (select) => {
    if (!onChangeScenarios || sheetScenarios.length === 0) return;
    const ids = sheetScenarios.map((s) => s.id);
    onChangeScenarios(select ? { add: ids } : { remove: ids });
  };

  const switchSheet = (direction) => {
    if (sheets.length < 2) return;
    const index = Math.max(0, sheets.indexOf(activeSheet));
    setActiveSheet(sheets[(index + direction + sheets.length) % sheets.length]);
  };

  keyHandlerRef.current = (event) => {
    if (event.type === 'keyup' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Meta') {
      setHeld((prev) => {
        const next = { shift: event.shiftKey, mod: event.ctrlKey || event.metaKey };
        return prev.shift === next.shift && prev.mod === next.mod ? prev : next;
      });
      if (event.type === 'keyup') return;
    }

    if (event.key === 'Escape') {
      if (showShortcuts) setShowShortcuts(false);
      else if (activeRegionId) setActiveRegionId(null);
      else onClose?.();
      return;
    }

    if (isTypingTarget(event)) return;

    const key = event.key.toLowerCase();
    const mod = hasMod(event);

    if (mod && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && key === 'y') {
      event.preventDefault();
      redo();
      return;
    }
    if (mod && key === 'a' && onChangeScenarios && tool !== 'view' && sheetScenarios.length > 0) {
      event.preventDefault();
      selectAllScenarios(!event.shiftKey);
      return;
    }
    if (mod) return;

    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      switchSheet(event.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (event.altKey) return;

    if (event.key === '?') {
      event.preventDefault();
      setShowShortcuts((prev) => !prev);
      return;
    }

    const toolEntry = Object.entries(TOOL_LABELS).find(([, meta]) => meta.key === event.key);
    if (toolEntry && availableTools.includes(toolEntry[0])) {
      setTool(toolEntry[0]);
      return;
    }
    if (canDraw && key === 'n') {
      setTool('region');
      setDrawMode('new');
      return;
    }
    if (canDraw && key === 'e') {
      setTool('region');
      setDrawMode('expand');
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && activeRegionId) {
      const region = draftRegions.find((r) => r.id === activeRegionId);
      if (region) {
        event.preventDefault();
        removeRegion(region);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (event) => keyHandlerRef.current?.(event);
    const reset = () => setHeld({ shift: false, mod: false });
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', handler);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', handler);
      window.removeEventListener('blur', reset);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black/50 p-2 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[98vw] h-[96vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
            <HelpTip id="scope-modal-overview" title="Cách chọn phạm vi quét" align="start">
              <p>Mỗi kịch bản và mỗi vùng tự chọn đều có một mã định danh nhỏ ở góc ô đầu tiên trên bảng (ví dụ R5C1, K1).</p>
              <p><b>Chọn kịch bản</b>: bấm vào kịch bản để bật/tắt việc quét.</p>
              <p><b>Vẽ vùng</b>: kéo trên bảng để tạo vùng mới (mã K1, K2...). Dùng chế độ <b>Mở rộng</b> để nới một vùng hoặc kịch bản có sẵn thay vì tạo cái mới.</p>
              <p className="pt-1 text-slate-500">Bấm phím <Kbd>?</Kbd> để xem toàn bộ phím tắt.</p>
            </HelpTip>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShortcuts((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Keyboard className="w-3.5 h-3.5" />
              Phím tắt
              <Kbd>?</Kbd>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
              <div className="flex flex-wrap items-center gap-2">
                {availableTools.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                      {availableTools.map((key) => {
                        const Icon = TOOL_LABELS[key].icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setTool(key)}
                            title={`Phím ${TOOL_LABELS[key].key}`}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500',
                              tool === key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {TOOL_LABELS[key].label}
                            <Kbd className="ml-0.5">{TOOL_LABELS[key].key}</Kbd>
                          </button>
                        );
                      })}
                    </div>
                    <HelpTip id="scope-modal-tools" title="Ba công cụ" align="end">
                      <p><b>Chọn kịch bản</b> (<Kbd>1</Kbd>): bấm vào kịch bản trên bảng để bật/tắt quét.</p>
                      <p><b>Vẽ vùng</b> (<Kbd>2</Kbd>): kéo chuột để tạo hoặc mở rộng vùng quét tự chọn.</p>
                      <p><b>Chỉ xem</b> (<Kbd>3</Kbd>): duyệt bảng, không thay đổi gì.</p>
                    </HelpTip>
                  </div>
                )}
                {canDraw && tool === 'region' && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1 p-1 bg-amber-50 border border-amber-200 rounded-lg">
                      {Object.entries(DRAW_MODES).map(([key, meta]) => {
                        const Icon = meta.icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setDrawMode(key)}
                            title={`Phím ${meta.key}`}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500',
                              effectiveMode === key ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                            <Kbd className="ml-0.5">{meta.key}</Kbd>
                          </button>
                        );
                      })}
                    </div>
                    <HelpTip id="scope-modal-drawmode" title="Vùng mới hay mở rộng?" align="end">
                      <p><b>Vùng mới</b>: mỗi lần kéo tạo một vùng riêng, có mã định danh mới (K1, K2...). Đây là mặc định.</p>
                      <p><b>Mở rộng vùng</b>: vùng vừa kéo được gộp vào vùng đang chọn. Nếu chưa chọn vùng nào, hãy bắt đầu kéo từ bên trong vùng hoặc kịch bản cần nới; kịch bản gốc sẽ được thay bằng vùng mở rộng.</p>
                      <p className="pt-1">Giữ <KeyCombo keys={['Shift']} /> để tạm mở rộng, giữ <KeyCombo keys={[MOD_LABEL]} /> để luôn tạo vùng mới.</p>
                    </HelpTip>
                  </div>
                )}
                {canDraw && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={undo}
                      disabled={!canUndo}
                      title={`Hoàn tác (${MOD_LABEL}+Z)`}
                      aria-label="Hoàn tác"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={redo}
                      disabled={!canRedo}
                      title={`Làm lại (${MOD_LABEL}+Shift+Z)`}
                      aria-label="Làm lại"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
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
              activeRegionId={activeRegionId}
              drawMode={effectiveMode}
              onToggleScenario={onToggleScenario}
              onScenarioClick={onChangeScenarios ? handleScenarioClick : undefined}
              onDrawRegion={handleDraw}
            />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Swatch className="bg-blue-50">Kịch bản được quét</Swatch>
              <Swatch className="bg-slate-100">Kịch bản bỏ qua</Swatch>
              <Swatch className="bg-violet-100">Vùng tự chọn đã nộp</Swatch>
              {canDraw && <Swatch className="bg-amber-100">Vùng đang chọn</Swatch>}
              {canDraw && <Swatch className="bg-sky-200">Đang kéo để mở rộng</Swatch>}
              {spellItems && <Swatch className="bg-yellow-200">Lỗi chính tả</Swatch>}
              {qcItems && <Swatch className="bg-red-100">Dòng có điểm QC chưa khớp</Swatch>}
              {showScanState && <span className="text-[11px] text-slate-400">Chữ mờ là ô không bị quét</span>}
              {canDraw && tool === 'region' && (
                <span className="text-[11px] text-slate-500 ml-auto">
                  Đang giữ: {held.mod ? `${MOD_LABEL} (tạo mới)` : held.shift ? 'Shift (mở rộng)' : `không phím (${DRAW_MODES[drawMode].label.toLowerCase()})`}
                </span>
              )}
            </div>
          </div>

          <aside className="w-80 shrink-0 border-l border-slate-200 p-4 overflow-y-auto space-y-5">
            {sheetScenarios.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-slate-700">Kịch bản trong sheet ({sheetScenarios.length})</h4>
                    <HelpTip id="scope-modal-scenarios" size="sm" title="Danh sách kịch bản">
                      <p>Mã nhỏ bên trái (ví dụ R5C1) là định danh của kịch bản, cũng hiện ở góc ô đầu tiên trên bảng.</p>
                      <p>Bấm vào tên để nhảy tới kịch bản trên bảng.</p>
                      {onChangeScenarios && (
                        <>
                          <p><KeyCombo keys={['Shift', 'Click']} /> chọn/bỏ cả dải kịch bản liên tiếp.</p>
                          <p><KeyCombo keys={[MOD_LABEL, 'Click']} /> chỉ giữ lại kịch bản này.</p>
                          <p><KeyCombo keys={[MOD_LABEL, 'A']} /> chọn tất cả, thêm <Kbd>Shift</Kbd> để bỏ tất cả.</p>
                        </>
                      )}
                    </HelpTip>
                  </div>
                  {onChangeScenarios && (
                    <div className="flex gap-1 text-[11px]">
                      <button type="button" onClick={() => selectAllScenarios(true)} className="px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                        Tất cả
                      </button>
                      <button type="button" onClick={() => selectAllScenarios(false)} className="px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                        Bỏ hết
                      </button>
                    </div>
                  )}
                </div>
                <ul className="space-y-1">
                  {sheetScenarios.map((scenario) => {
                    const checked = selectedSet ? selectedSet.has(scenario.id) : true;
                    return (
                      <li key={scenario.id} className="flex items-center gap-2 text-xs">
                        {onToggleScenario ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            onClick={(e) => handleScenarioClick(scenario.id, { shift: e.shiftKey, mod: e.ctrlKey || e.metaKey })}
                            aria-label={`Quét kịch bản ${scenario.scenarioLabel}`}
                          />
                        ) : (
                          <span className={cn('w-2 h-2 rounded-full shrink-0', checked ? 'bg-blue-500' : 'bg-slate-300')} />
                        )}
                        <CodeBadge tone={checked ? 'blue' : 'slate'}>{scenarioCode(scenario)}</CodeBadge>
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
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-semibold text-slate-700">Vùng tự chọn ({totalRegions})</h4>
                <HelpTip id="scope-modal-regions" size="sm" title="Vùng tự chọn">
                  <p>Mỗi vùng có một mã cố định (K1, K2...) dùng để nhận diện vùng trong kết quả chính tả và QC.</p>
                  <p>Bấm vào một vùng để chọn nó, sau đó sửa toạ độ trực tiếp để mở rộng hoặc thu hẹp, hoặc kéo thêm ở chế độ <b>Mở rộng</b>.</p>
                  <p>Vùng ghi <i>Mở rộng từ kịch bản</i> đang thay thế kịch bản gốc, kịch bản đó sẽ không bị quét hai lần.</p>
                </HelpTip>
              </div>
              {totalRegions === 0 && (
                <p className="text-xs text-slate-400">
                  {canDraw ? 'Chưa có vùng nào. Chọn công cụ Vẽ vùng rồi kéo trên bảng, hoặc nhập toạ độ bên dưới.' : 'Không có vùng tự chọn.'}
                </p>
              )}
              <ul className="space-y-2">
                {visibleFixed.map((region) => (
                  <li
                    key={`${region.sheet}:${region.id}`}
                    className={cn(
                      'p-2 border bg-violet-50 rounded-lg text-xs space-y-0.5',
                      activeRegionId === region.id && region.sheet === activeSheet ? 'border-amber-400 ring-1 ring-amber-300' : 'border-violet-200'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <CodeBadge tone="violet">{region.id}</CodeBadge>
                      <button type="button" onClick={() => focusRegion(region)} className="font-medium text-slate-800 hover:text-blue-700 text-left truncate">
                        {region.label || 'Vùng tự chọn'}
                      </button>
                    </div>
                    <div className="text-slate-500">
                      {region.sheet}!{regionRange(region)} · {regionCellCount(region)} ô{region.qc === false ? ' · không QC' : ''}
                    </div>
                  </li>
                ))}
                {draftRegions.map((region) => {
                  const isActive = activeRegionId === region.id && region.sheet === activeSheet;
                  const overridesFixed = fixedRegions.some((f) => f.sheet === region.sheet && f.id === region.id);
                  const extendedScenario = region.extends
                    ? (scenariosBySheet[region.sheet] || []).find((s) => s.id === region.extends)
                    : null;
                  return (
                    <li
                      key={`${region.sheet}:${region.id}`}
                      className={cn(
                        'p-2 border bg-amber-50 rounded-lg text-xs space-y-1.5',
                        isActive ? 'border-amber-500 ring-1 ring-amber-400' : 'border-amber-200'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <CodeBadge tone="amber">{region.id}</CodeBadge>
                        <input
                          type="text"
                          value={region.label}
                          onChange={(e) => updateRegion(region.id, { label: e.target.value.slice(0, 100) })}
                          onFocus={() => setActiveRegionId(region.id)}
                          className="flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Tên vùng"
                        />
                        <button
                          type="button"
                          onClick={() => removeRegion(region)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                          aria-label="Xoá vùng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {(region.extends || overridesFixed) && (
                        <div className="text-[11px] text-amber-700">
                          {region.extends
                            ? `Mở rộng từ kịch bản ${extendedScenario ? `${scenarioCode(extendedScenario)} · ${extendedScenario.scenarioLabel}` : region.extends.split('::').pop()}`
                            : 'Mở rộng từ vùng đã nộp, sẽ thay thế vùng cũ khi quét lại'}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <RangeField region={region} onCommit={commitRegionRange} />
                        <button type="button" onClick={() => focusRegion(region)} className="text-slate-500 hover:text-blue-700 text-left">
                          {region.sheet} · {regionCellCount(region)} ô
                        </button>
                      </div>
                      <label className="flex items-center gap-1.5 text-slate-600">
                        <input type="checkbox" checked={region.qc !== false} onChange={(e) => updateRegion(region.id, { qc: e.target.checked })} />
                        Đối chiếu QC cho vùng này
                      </label>
                    </li>
                  );
                })}
              </ul>

              {canDraw && (
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

        {showShortcuts && (
          <div
            className="absolute inset-0 z-30 bg-black/30 flex items-center justify-center p-4"
            onMouseDown={() => setShowShortcuts(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-full overflow-y-auto p-5 space-y-3"
              onMouseDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Phím tắt"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Keyboard className="w-4 h-4" /> Phím tắt
                </h4>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Đóng bảng phím tắt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="divide-y divide-slate-100">
                {SHORTCUTS.map((item) => (
                  <li key={item.text} className="flex items-start gap-3 py-2 text-xs text-slate-600">
                    <span className="w-44 shrink-0">
                      {item.joiner ? (
                        <span className="inline-flex items-center gap-1">
                          {item.keys.map((k, i) => (
                            <span key={k} className="inline-flex items-center gap-1">
                              {i > 0 && <span className="text-slate-400">{item.joiner}</span>}
                              <Kbd>{k}</Kbd>
                            </span>
                          ))}
                        </span>
                      ) : (
                        <KeyCombo keys={item.keys} />
                      )}
                    </span>
                    <span className="flex-1">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
