import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { boundsOfScenario, cellInBounds, colLetters, isCellScanned, parseCellRef } from '../../utils/sheetScope';

const ROW_COUNT = 40;
const COL_COUNT = 14;
const ROW_STEP = 20;
const COL_STEP = 7;
const HEADER_HEIGHT = 24;
const SCROLL_GUARD_MS = 300;

const CELL_MAX_LINES = 12;

const cellTextStyle = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: CELL_MAX_LINES,
  overflow: 'hidden',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const NavButton = ({ onClick, disabled, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {children}
  </button>
);

export const SheetGridPreview = ({
  source,
  sheet,
  scenarios = [],
  selectedScenarioIds = null,
  fixedRegions = [],
  draftRegions = [],
  spellCells,
  qcRows,
  areas = null,
  showScanState = false,
  tool = 'view',
  focus = null,
  onToggleScenario,
  onDrawRegion,
}) => {
  const [origin, setOrigin] = useState({ row: 1, col: 1 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(null);
  const [gotoText, setGotoText] = useState('');
  const [flash, setFlash] = useState(null);
  const requestId = useRef(0);
  const scrollRef = useRef(null);
  const anchorRef = useRef(null);
  const guardUntil = useRef(0);

  useEffect(() => {
    setOrigin({ row: 1, col: 1 });
    setData(null);
    setError('');
  }, [sheet, source?.key]);

  useEffect(() => {
    if (!focus || focus.sheet !== sheet) return undefined;
    setOrigin({ row: Math.max(1, focus.row - 4), col: Math.max(1, focus.col - 2) });
    setFlash({ row: focus.row, col: focus.col });
    const timer = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(timer);
  }, [focus?.nonce, focus?.sheet, focus?.row, focus?.col, sheet]);

  useEffect(() => {
    if (!source || !sheet) return undefined;
    requestId.current += 1;
    const id = requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await source.load({
          sheet,
          rowStart: origin.row,
          rowCount: ROW_COUNT,
          colStart: origin.col,
          colCount: COL_COUNT,
        });
        if (id !== requestId.current) return;
        setData(result);
        setError('');
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err?.data?.message || err?.message || 'Không thể tải dữ liệu bảng');
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [source, sheet, origin.row, origin.col]);

  useEffect(() => {
    if (!drag) return undefined;
    const finish = () => {
      setDrag(null);
      onDrawRegion?.({
        sheet,
        startRow: Math.min(drag.startRow, drag.endRow),
        endRow: Math.max(drag.startRow, drag.endRow),
        startCol: Math.min(drag.startCol, drag.endCol),
        endCol: Math.max(drag.startCol, drag.endCol),
      });
    };
    window.addEventListener('mouseup', finish);
    return () => window.removeEventListener('mouseup', finish);
  }, [drag, onDrawRegion, sheet]);

  const scenarioAreas = useMemo(() => {
    const selected = selectedScenarioIds ? new Set(selectedScenarioIds) : null;
    return scenarios.map((scenario) => ({
      scenario,
      bounds: boundsOfScenario(scenario),
      selected: selected ? selected.has(scenario.id) : true,
    }));
  }, [scenarios, selectedScenarioIds]);

  const layout = useMemo(() => {
    const spans = new Map();
    const covered = new Set();
    if (!data) return { spans, covered };
    const rowEnd = data.rowStart + data.rows.length - 1;
    const colEnd = data.colStart + (data.rows[0]?.length || 0) - 1;
    (data.merges || []).forEach((m) => {
      const r0 = Math.max(m.startRow, data.rowStart);
      const c0 = Math.max(m.startCol, data.colStart);
      const r1 = Math.min(m.endRow, rowEnd);
      const c1 = Math.min(m.endCol, colEnd);
      if (r1 < r0 || c1 < c0) return;
      spans.set(`${r0}:${c0}`, { rowSpan: r1 - r0 + 1, colSpan: c1 - c0 + 1 });
      for (let r = r0; r <= r1; r += 1) {
        for (let c = c0; c <= c1; c += 1) {
          if (r !== r0 || c !== c0) covered.add(`${r}:${c}`);
        }
      }
    });
    return { spans, covered };
  }, [data]);

  const move = (dRow, dCol) => {
    setOrigin((prev) => ({
      row: clamp(prev.row + dRow, 1, Math.max(1, (data?.maxRow || 1) - 1)),
      col: clamp(prev.col + dCol, 1, Math.max(1, (data?.maxCol || 1) - 1)),
    }));
  };

  const captureAnchor = () => {
    const el = scrollRef.current;
    if (!el) return null;
    const box = el.getBoundingClientRect();
    const rowEls = el.querySelectorAll('tbody tr[data-row]');
    for (const tr of rowEls) {
      const rect = tr.getBoundingClientRect();
      if (rect.bottom > box.top + HEADER_HEIGHT) {
        return { row: Number(tr.dataset.row), top: rect.top - box.top };
      }
    }
    return null;
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !data || loading || Date.now() < guardUntil.current) return;
    if (data.rowStart !== origin.row) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    const atTop = el.scrollTop <= 0;
    const hasMoreDown = data.rowStart + ROW_COUNT - 1 < data.maxRow;
    if (atBottom && hasMoreDown) {
      anchorRef.current = captureAnchor();
      move(ROW_STEP, 0);
    } else if (atTop && origin.row > 1) {
      anchorRef.current = captureAnchor();
      move(-ROW_STEP, 0);
    }
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !data) return;
    guardUntil.current = Date.now() + SCROLL_GUARD_MS;
    const anchor = anchorRef.current;
    anchorRef.current = null;
    const target = anchor ? el.querySelector(`tbody tr[data-row="${anchor.row}"]`) : null;
    if (!target) {
      el.scrollTop = 0;
      return;
    }
    const box = el.getBoundingClientRect();
    el.scrollTop += target.getBoundingClientRect().top - box.top - anchor.top;
  }, [data]);

  const handleGoto = (event) => {
    event.preventDefault();
    const parsed = parseCellRef(gotoText);
    if (!parsed) return;
    setOrigin({ row: Math.max(1, parsed.row - 2), col: Math.max(1, parsed.col - 1) });
    setFlash({ row: parsed.row, col: parsed.col });
    setTimeout(() => setFlash(null), 2500);
  };

  const dragRect = drag
    ? {
        startRow: Math.min(drag.startRow, drag.endRow),
        endRow: Math.max(drag.startRow, drag.endRow),
        startCol: Math.min(drag.startCol, drag.endCol),
        endCol: Math.max(drag.startCol, drag.endCol),
      }
    : null;

  const describeCell = (row, col) => {
    const scenarioHit = scenarioAreas.find((s) => cellInBounds(s.bounds, row, col));
    const draftHit = draftRegions.find((r) => cellInBounds(r, row, col));
    const fixedHit = fixedRegions.find((r) => cellInBounds(r, row, col));
    return { scenarioHit, draftHit, fixedHit };
  };

  const rows = data?.rows || [];
  const colCount = rows[0]?.length || COL_COUNT;
  const firstRow = data?.rowStart || origin.row;
  const firstCol = data?.colStart || origin.col;

  const cellClasses = (row, col, hits) => {
    const key = `${row}:${col}`;
    const spell = spellCells?.get(key);
    const scanned = !showScanState || isCellScanned(areas, row, col);
    const inDrag = dragRect && cellInBounds(dragRect, row, col);
    let tone = 'bg-white';
    if (inDrag) tone = 'bg-orange-200';
    else if (spell === 'confirmed') tone = 'bg-yellow-200';
    else if (spell === 'dismissed') tone = 'bg-yellow-50 line-through decoration-slate-400';
    else if (hits.draftHit) tone = 'bg-amber-100';
    else if (hits.fixedHit) tone = 'bg-violet-100';
    else if (hits.scenarioHit) tone = hits.scenarioHit.selected ? 'bg-blue-50' : 'bg-slate-100';
    return cn(
      'border border-slate-200 px-1.5 py-1 h-6 align-top max-w-[220px] min-w-[56px] whitespace-pre-wrap [overflow-wrap:anywhere] text-[11px] leading-4 text-slate-800',
      tone,
      !scanned && 'text-slate-300',
      tool === 'region' && 'cursor-crosshair',
      tool === 'scenario' && hits.scenarioHit && 'cursor-pointer',
      flash && flash.row === row && flash.col === col && 'relative z-10 ring-2 ring-red-500'
    );
  };

  const handleMouseDown = (event, row, col) => {
    if (tool !== 'region' || event.button !== 0) return;
    event.preventDefault();
    setDrag({ startRow: row, endRow: row, startCol: col, endCol: col });
  };

  const handleMouseEnter = (row, col) => {
    if (!drag) return;
    setDrag((prev) => (prev ? { ...prev, endRow: row, endCol: col } : prev));
  };

  const handleClick = (hits) => {
    if (tool !== 'scenario' || !hits.scenarioHit) return;
    onToggleScenario?.(hits.scenarioHit.scenario.id);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <NavButton label="Lên" onClick={() => move(-ROW_STEP, 0)} disabled={origin.row <= 1}>
            <ChevronUp className="w-4 h-4" />
          </NavButton>
          <NavButton label="Xuống" onClick={() => move(ROW_STEP, 0)} disabled={data && origin.row + ROW_COUNT > data.maxRow}>
            <ChevronDown className="w-4 h-4" />
          </NavButton>
          <NavButton label="Sang trái" onClick={() => move(0, -COL_STEP)} disabled={origin.col <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </NavButton>
          <NavButton label="Sang phải" onClick={() => move(0, COL_STEP)} disabled={data && origin.col + COL_COUNT > data.maxCol}>
            <ChevronRight className="w-4 h-4" />
          </NavButton>
        </div>
        <form onSubmit={handleGoto} className="flex items-center gap-1">
          <input
            type="text"
            value={gotoText}
            onChange={(e) => setGotoText(e.target.value)}
            placeholder="Đi tới ô, ví dụ B120"
            className="w-36 px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
        <span className="text-slate-500">
          Dòng {firstRow}–{firstRow + ROW_COUNT - 1}
          {data ? ` / ${data.maxRow}` : ''}, cột {colLetters(firstCol)}–{colLetters(firstCol + colCount - 1)}
          {data ? ` / ${colLetters(Math.max(1, data.maxCol))}` : ''}
        </span>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
      </div>

      {error && <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-auto border border-slate-200 rounded-xl bg-white select-none"
      >
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 w-12 min-w-[48px] bg-slate-100 border border-slate-200" />
              {Array.from({ length: colCount }, (_, i) => (
                <th
                  key={i}
                  className="sticky top-0 z-10 bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-500 px-1.5 h-6"
                >
                  {colLetters(firstCol + i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((line, rIdx) => {
              const row = firstRow + rIdx;
              const hasQc = qcRows?.has(row);
              return (
                <tr key={row} data-row={row}>
                  <th
                    className={cn(
                      'sticky left-0 z-10 border border-slate-200 text-[11px] font-medium px-1.5 h-6 text-right align-top pt-1',
                      hasQc ? 'bg-red-100 text-red-700 font-bold' : 'bg-slate-100 text-slate-500'
                    )}
                    title={hasQc ? 'Dòng có điểm QC chưa khớp' : undefined}
                  >
                    {row}
                  </th>
                  {line.map((value, cIdx) => {
                    const col = firstCol + cIdx;
                    const key = `${row}:${col}`;
                    if (layout.covered.has(key)) return null;
                    const span = layout.spans.get(key);
                    const hits = describeCell(row, col);
                    return (
                      <td
                        key={key}
                        rowSpan={span?.rowSpan}
                        colSpan={span?.colSpan}
                        title={value || hits.scenarioHit?.scenario.scenarioLabel || undefined}
                        className={cellClasses(row, col, hits)}
                        onMouseDown={(e) => handleMouseDown(e, row, col)}
                        onMouseEnter={() => handleMouseEnter(row, col)}
                        onClick={() => handleClick(hits)}
                      >
                        {value ? <div style={cellTextStyle}>{value}</div> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};