import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, CircleDashed, Loader2, TriangleAlert, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { scenarioCode } from '../../utils/sheetScope';
import { HelpTip } from '../ui/HelpTip';

const STATUS_META = {
  pending: { label: 'Đang chờ', badge: 'bg-slate-100 text-slate-600', icon: CircleDashed },
  running: { label: 'Đang chạy', badge: 'bg-blue-100 text-blue-700', icon: Loader2 },
  done: { label: 'Xong', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  error: { label: 'Lỗi', badge: 'bg-red-100 text-red-700', icon: XCircle },
};

const idPart = (id) => String(id || '').split('::').pop();

const rowInRanges = (item, scenarios) => {
  const range = Array.isArray(item.row_range) ? item.row_range : [item.row_range, item.row_range];
  const start = Number(range[0]);
  const end = Number(range[1] ?? range[0]);
  return scenarios.some((s) => Array.isArray(s.rowRange) && s.rowRange[0] <= end && s.rowRange[1] >= start);
};

const belongsToBatch = (item, batch) => {
  if (item.sheet_name !== batch.sheet) return false;
  if (item.blockId) return batch.blockIds.includes(item.blockId);
  return rowInRanges(item, batch.scenarios || []);
};

export const QcMismatchRow = ({ item, readOnly, disabled, onToggle, onLocate, canLocate }) => (
  <label className="flex items-start gap-2 px-3 py-1.5 text-xs">
    {readOnly ? (
      <span className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
    ) : (
      <input
        type="checkbox"
        className="mt-0.5"
        checked={item.confirmed}
        disabled={disabled}
        onChange={(e) => onToggle?.(item.id, e.target.checked)}
      />
    )}
    <div className="space-y-0.5 min-w-0">
      <div className="text-slate-700 font-medium">
        {item.sheet_name ? `${item.sheet_name}${item.scenario ? ` / ${item.scenario}` : ''} · ` : ''}
        {item.product_ref || 'Không rõ sản phẩm'} · {item.attribute}
        {canLocate && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onLocate?.(item);
            }}
            className="ml-2 text-[11px] font-normal text-blue-600 hover:underline"
          >
            Xem trên bảng
          </button>
        )}
      </div>
      <div className="text-slate-500">
        <span className="text-red-600">{item.claimed_value}</span>
        <span className="mx-1 text-slate-400">→</span>
        {item.expected_value != null ? (
          <span className="font-medium text-emerald-700">{item.expected_value}</span>
        ) : (
          <span className="italic text-slate-400">không tìm thấy</span>
        )}
      </div>
      <div className="text-slate-400 italic">{item.reasoning}</div>
    </div>
  </label>
);

const formatDuration = (ms) => {
  if (ms == null) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
};

export const QcBatchPanel = ({
  batches = [],
  reviewedItems = [],
  settled,
  multiSheet,
  isFinalized,
  canReview,
  onToggle,
  onLocate,
  canLocate,
}) => {
  const [expanded, setExpanded] = useState({});

  const total = batches.length;
  const finished = batches.filter((b) => b.status === 'done' || b.status === 'error').length;
  const failed = batches.filter((b) => b.status === 'error').length;
  const percent = total === 0 ? 0 : Math.round((finished / total) * 100);

  const rowsByBatch = useMemo(() => {
    const map = new Map();
    batches.forEach((batch) => {
      const live = (batch.mismatches || []).filter((m) => m.status !== 'unresolved');
      const reviewed = reviewedItems.filter((item) => belongsToBatch(item, batch));
      map.set(batch.key, settled && reviewed.length > 0 ? { rows: reviewed, readOnly: false } : { rows: live, readOnly: true });
    });
    return map;
  }, [batches, reviewedItems, settled]);

  const orphanItems = useMemo(
    () => (settled ? reviewedItems.filter((item) => !batches.some((batch) => belongsToBatch(item, batch))) : []),
    [batches, reviewedItems, settled]
  );

  const isOpen = (batch, rowCount) => expanded[batch.key] ?? (rowCount > 0 || batch.status === 'error' || batch.status === 'running');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-xs font-bold text-slate-700">Kết quả theo batch</div>
        <HelpTip id="qc-batches" size="sm" title="QC chạy theo từng batch" align="start">
          <p>Các kịch bản được chia thành nhiều batch để gửi cho AI đối chiếu. Mỗi batch trả kết quả riêng ngay khi chạy xong, bạn không cần chờ toàn bộ.</p>
          <p>Bấm vào một batch để xem danh sách kịch bản (kèm mã định danh) và các điểm chưa khớp của riêng batch đó.</p>
          <p>Batch báo <b>Lỗi</b> nghĩa là các kịch bản trong batch chưa được đối chiếu. Bấm Kiểm tra lại QC để chạy lại.</p>
        </HelpTip>
        <div className="ml-auto text-[11px] text-slate-500">
          {finished}/{total} batch
          {failed > 0 && <span className="text-red-600"> · {failed} lỗi</span>}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={cn('h-full transition-all', failed > 0 ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${percent}%` }}
        />
      </div>

      {failed > 0 && settled && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{failed} batch bị lỗi nên kết quả QC chưa đầy đủ. Hãy kiểm tra lại QC trước khi chốt.</div>
        </div>
      )}

      <ul className="space-y-2">
        {batches.map((batch, position) => {
          const meta = STATUS_META[batch.status] || STATUS_META.pending;
          const Icon = meta.icon;
          const { rows, readOnly } = rowsByBatch.get(batch.key) || { rows: [], readOnly: true };
          const open = isOpen(batch, rows.length);
          const duration = formatDuration(batch.durationMs);
          const preview = (batch.scenarios || []).slice(0, 3).map((s) => s.label).join(', ');
          const more = (batch.scenarios || []).length - 3;
          return (
            <li key={batch.key} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [batch.key]: !open }))}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={open}
              >
                {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span className="text-xs font-bold text-slate-700 shrink-0">
                  Batch {position + 1}/{total}
                </span>
                {multiSheet && <span className="text-[11px] text-slate-500 shrink-0">{batch.sheet}</span>}
                <span className="text-[11px] text-slate-400 truncate min-w-0">
                  {preview}
                  {more > 0 ? ` +${more}` : ''}
                </span>
                <span className="ml-auto flex items-center gap-1.5 shrink-0">
                  {rows.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">{rows.length} chưa khớp</span>
                  )}
                  {batch.status === 'done' && rows.length === 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">Khớp hết</span>
                  )}
                  <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold', meta.badge)}>
                    <Icon className={cn('w-3 h-3', batch.status === 'running' && 'animate-spin')} />
                    {meta.label}
                  </span>
                </span>
              </button>

              {open && (
                <div className="border-t border-slate-100">
                  <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-slate-50">
                    {(batch.scenarios || []).map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600"
                        title={s.id}
                      >
                        <span className="font-bold text-slate-700">{scenarioCode({ id: s.id }) || idPart(s.id)}</span>
                        <span className="truncate max-w-[140px]">{s.label}</span>
                        {Array.isArray(s.rowRange) && <span className="text-slate-400">{s.rowRange[0]}–{s.rowRange[1]}</span>}
                      </span>
                    ))}
                    {(duration || batch.cached || batch.unverified > 0) && (
                      <span className="ml-auto text-[10px] text-slate-400">
                        {duration}
                        {batch.cached ? ' · từ cache' : ''}
                        {batch.unverified > 0 ? ` · soát lại ${batch.unverified} kịch bản` : ''}
                      </span>
                    )}
                  </div>

                  {batch.status === 'error' && (
                    <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{batch.error || 'Batch này bị lỗi'}</div>
                  )}

                  {(batch.status === 'pending' || batch.status === 'running') && rows.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400">
                      {batch.status === 'running' ? 'Đang đối chiếu batch này...' : 'Chưa tới lượt batch này'}
                    </div>
                  )}

                  {batch.status === 'done' && rows.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400">Không phát hiện điểm chưa khớp trong batch này</div>
                  )}

                  {rows.length > 0 && (
                    <div className="divide-y">
                      {rows.map((item, index) => (
                        <QcMismatchRow
                          key={`${item.id}-${index}`}
                          item={item}
                          readOnly={readOnly}
                          disabled={isFinalized || !canReview}
                          onToggle={onToggle}
                          onLocate={onLocate}
                          canLocate={canLocate?.(item)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {orphanItems.length > 0 && (
        <div className="border border-slate-200 rounded-xl bg-white">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 border-b border-slate-100">Kết quả không thuộc batch nào</div>
          <div className="divide-y">
            {orphanItems.map((item) => (
              <QcMismatchRow
                key={item.id}
                item={item}
                disabled={isFinalized || !canReview}
                onToggle={onToggle}
                onLocate={onLocate}
                canLocate={canLocate?.(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
