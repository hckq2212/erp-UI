import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, SpellCheck, ClipboardCheck, Download, FileSpreadsheet, Lock, RefreshCw, PackageSearch, ChevronDown, ChevronRight, Eye, TriangleAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import { SpellCheckWhitelist } from './SpellCheckWhitelist';
import { ScanScopePreviewModal } from './ScanScopePreviewModal';
import { QcBatchPanel, QcMismatchRow } from './QcBatchPanel';
import { HelpTip } from '../ui/HelpTip';
import { locateQcItem, locateSpellItem, regionRef } from '../../utils/sheetScope';
import {
  useGetTaskResultCheckQuery,
  useLazyGetTaskResultCheckPreviewQuery,
  useToggleResultCheckItemMutation,
  useToggleResultCheckItemsMutation,
  useFinalizeResultCheckMutation,
  useRerunResultCheckMutation,
} from '../../api/taskResultChecks';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '/api';

const groupByToken = (items) => {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item.token)) map.set(item.token, []);
    map.get(item.token).push(item);
  });
  return Array.from(map.entries()).map(([token, group]) => ({
    token,
    items: group,
    confirmedCount: group.filter((i) => i.confirmed).length,
  }));
};

const groupSpellItems = (items) => {
  return groupByToken(items).sort((a, b) => b.items.length - a.items.length);
};

const CheckStateBox = ({ status, errorMessage, label, onRetry, isRetrying, canRetry }) => {
  if (status === 'PENDING' || status === 'RUNNING') {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra {label}...
      </div>
    );
  }
  if (status === 'ERROR') {
    return (
      <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
        <div className="text-xs text-red-600">{errorMessage || `Lỗi khi kiểm tra ${label}`}</div>
        {canRetry && (
          <Button type="button" size="sm" variant="outline" isLoading={isRetrying} onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Kiểm tra lại {label}
          </Button>
        )}
      </div>
    );
  }
  return null;
};

export const TaskResultChecksPanel = ({ taskId, projectId }) => {
  const [pollMs, setPollMs] = useState(30000);
  const { data: record, isLoading } = useGetTaskResultCheckQuery(taskId, {
    pollingInterval: pollMs,
    skip: !taskId,
  });
  const isRunning = Boolean(record) && (record.qcStatus === 'RUNNING' || record.spellStatus === 'RUNNING');
  useEffect(() => {
    setPollMs(isRunning ? 4000 : 30000);
  }, [isRunning]);
  const [toggleItem] = useToggleResultCheckItemMutation();
  const [toggleItems] = useToggleResultCheckItemsMutation();
  const [finalize, { isLoading: isFinalizing }] = useFinalizeResultCheckMutation();
  const [rerunSpell, { isLoading: isRerunningSpell }] = useRerunResultCheckMutation();
  const [rerunQc, { isLoading: isRerunningQc }] = useRerunResultCheckMutation();
  const [rerunWhitelist, setRerunWhitelist] = useState(null);
  const [qcNote, setQcNote] = useState('');
  const [qcRefresh, setQcRefresh] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFocus, setPreviewFocus] = useState(null);
  const [rerunRegions, setRerunRegions] = useState([]);
  const [rerunScoped, { isLoading: isRerunningScoped }] = useRerunResultCheckMutation();
  const [fetchPreview] = useLazyGetTaskResultCheckPreviewQuery();

  const previewVersion = record?.id;
  const previewSource = useMemo(
    () => (taskId && previewVersion
      ? {
          key: `task:${taskId}:${previewVersion}`,
          load: (request) => fetchPreview({ taskId, version: previewVersion, ...request }, true).unwrap(),
        }
      : null),
    [taskId, previewVersion, fetchPreview]
  );

  const scannedScenarios = record?.scannedScenarios;
  const scenariosBySheet = useMemo(() => {
    const map = {};
    (scannedScenarios || []).forEach((scenario) => {
      if (!map[scenario.sheet]) map[scenario.sheet] = [];
      map[scenario.sheet].push(scenario);
    });
    return map;
  }, [scannedScenarios]);

  const spellItems = record?.reviewedSpellErrors || [];
  const spellGroups = useMemo(() => groupSpellItems(spellItems), [spellItems]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 p-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải kết quả kiểm tra...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
        Kết quả này không được tự động kiểm tra chính tả/QC.
      </div>
    );
  }

  const canReview = Boolean(record.canReview);
  const isFinalized = Boolean(record.finalizedAt);

  if (!canReview && !isFinalized) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Kết quả đang được rà soát chính tả/QC, sẽ hiển thị sau khi được chốt.
      </div>
    );
  }

  const spellStatus = record.spellStatus || record.status;
  const qcStatus = record.qcStatus || record.status;
  const spellReady = spellStatus === 'DONE';
  const qcReady = qcStatus === 'DONE';
  const canFinalize = spellReady && qcReady;
  const qcItems = record.reviewedQcMismatches || [];
  const qcMismatchItems = qcItems.filter((i) => i.status !== 'unresolved');
  const qcNoteItems = qcItems.filter((i) => i.status === 'unresolved');
  const qcBatches = record.qcBatches || [];
  const confirmedSpellCount = spellItems.filter((i) => i.confirmed).length;
  const confirmedQcCount = qcMismatchItems.filter((i) => i.confirmed).length;
  const activeWhitelist = rerunWhitelist ?? record.reviewerWhitelist ?? [];
  const scopeSheets = record.sheetNames || [];
  const scopeRegions = record.scanRegions || [];
  const detectedScenarios = record.scannedScenarios || [];
  const selectedScenarioIds = record.scenarioIds ?? detectedScenarios.map((s) => s.id);
  const selectedScenarioCount = detectedScenarios.filter((s) => selectedScenarioIds.includes(s.id)).length;
  const fallbackSheet = scopeSheets.length === 1 ? scopeSheets[0] : null;
  const canRerunScoped = canReview && !isFinalized;
  const isAnyRunning = spellStatus === 'RUNNING' || qcStatus === 'RUNNING';

  const openPreview = (target) => {
    setPreviewFocus(target ? { ...target, nonce: Date.now() } : null);
    setIsPreviewOpen(true);
  };

  const locateSpell = (item) => {
    const target = locateSpellItem(item, fallbackSheet);
    if (target) openPreview(target);
  };

  const locateQc = (item) => {
    const target = locateQcItem(item);
    if (target) openPreview(target);
  };

  const handleScopedRerun = async (kind) => {
    try {
      await rerunScoped({
        taskId,
        kind,
        whitelist: activeWhitelist,
        scope: { scenarioIds: [], regions: rerunRegions },
        ...(kind !== 'SPELL' ? { reviewerNote: qcNote.trim() || undefined, refresh: qcRefresh } : {}),
      }).unwrap();
      if (kind !== 'SPELL') { setQcNote(''); setQcRefresh(false); }
      toast.success('Đang quét lại các vùng đã chọn...');
      setRerunRegions([]);
      setIsPreviewOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể quét lại các vùng đã chọn');
    }
  };

  // Nếu người dùng đã sửa whitelist cục bộ (rerunWhitelist), danh sách đó sẽ che mất
  // whitelist từ server -> phải đồng bộ lại khi tick/bỏ tick để không gửi lên danh sách cũ.
  const syncLocalWhitelist = (itemIds, confirmed) => {
    if (rerunWhitelist === null) return;
    const idSet = new Set(itemIds);
    const tokens = Array.from(new Set(spellItems.filter((i) => idSet.has(i.id)).map((i) => i.token).filter(Boolean)));
    if (!confirmed) {
      setRerunWhitelist((prev) => Array.from(new Set([...(prev ?? []), ...tokens])));
      return;
    }
    const stillDismissed = new Set(
      spellItems.filter((i) => !i.confirmed && !idSet.has(i.id)).map((i) => i.token)
    );
    const restored = new Set(tokens.filter((token) => !stillDismissed.has(token)));
    setRerunWhitelist((prev) => (prev ?? []).filter((word) => !restored.has(word)));
  };

  const handleToggle = async (kind, itemId, confirmed) => {
    try {
      await toggleItem({ taskId, kind, itemId, confirmed }).unwrap();
      if (kind === 'SPELL') syncLocalWhitelist([itemId], confirmed);
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể cập nhật mục kiểm tra');
    }
  };

  const handleToggleGroup = async (group, confirmed) => {
    try {
      const itemIds = group.items.map((item) => item.id);
      await toggleItems({ taskId, kind: 'SPELL', itemIds, confirmed }).unwrap();
      syncLocalWhitelist(itemIds, confirmed);
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể cập nhật mục kiểm tra');
    }
  };

  const toggleExpanded = (token) => {
    setExpandedTokens((prev) => ({ ...prev, [token]: !prev[token] }));
  };

  const handleFinalize = async () => {
    try {
      await finalize(taskId).unwrap();
      toast.success('Đã chốt kết quả kiểm tra');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể chốt kết quả kiểm tra');
    }
  };

  const handleRerunSpell = async () => {
    try {
      await rerunSpell({ taskId, kind: 'SPELL', whitelist: activeWhitelist }).unwrap();
      toast.success('Đang kiểm tra lại chính tả...');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể kiểm tra lại chính tả');
    }
  };

  const handleRerunQc = async () => {
    try {
      await rerunQc({ taskId, kind: 'QC', whitelist: activeWhitelist, reviewerNote: qcNote.trim() || undefined, refresh: qcRefresh }).unwrap();
      setQcNote('');
      setQcRefresh(false);
      toast.success('Đang kiểm tra lại QC...');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể kiểm tra lại QC');
    }
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
      {scopeSheets.length > 0 && previewSource && (
        <div className="space-y-2 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              Phạm vi quét
              <HelpTip id="check-scope" title="Phạm vi quét" align="start">
                <p>Hiển thị các sheet, kịch bản và vùng tự chọn đã được quét. Mỗi kịch bản/vùng có mã định danh riêng (R5C1, K1...).</p>
                <p>Với người rà soát, có thể mở bảng để quét lại từng vùng: dùng <b>Vẽ vùng</b> để tạo vùng mới hoặc <b>Mở rộng</b> để nới một vùng/kịch bản đã quét.</p>
                <p>Trong cửa sổ bảng bấm phím <b>?</b> để xem phím tắt.</p>
              </HelpTip>
            </div>
            <button
              type="button"
              onClick={() => openPreview(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Eye className="w-3.5 h-3.5" />
              {canRerunScoped ? 'Xem bảng và quét lại theo vùng' : 'Xem trên bảng'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scopeSheets.map((name) => (
              <span key={name} className="px-2 py-0.5 text-[11px] font-medium bg-white border border-slate-200 text-slate-700 rounded-full">
                {name}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            {detectedScenarios.length > 0 && <span>Kịch bản quét: {selectedScenarioCount}/{detectedScenarios.length}</span>}
            {detectedScenarios.length > 0 && scopeRegions.length > 0 && <span> · </span>}
            {scopeRegions.length > 0 && <span>Vùng tự chọn: {scopeRegions.length}</span>}
            {detectedScenarios.length === 0 && scopeRegions.length === 0 && <span>Quét toàn bộ nội dung các sheet đã chọn</span>}
          </div>
          {scopeRegions.length > 0 && (
            <ul className="space-y-1">
              {scopeRegions.map((region) => (
                <li key={`${region.sheet}:${region.id}`} className="text-xs text-slate-600">
                  <span className="font-medium">{region.label || 'Vùng tự chọn'}</span>
                  <span className="text-slate-400"> · {regionRef(region)}{region.qc === false ? ' · không QC' : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <SpellCheck className="w-4 h-4" />
          Lỗi chính tả ({confirmedSpellCount}/{spellItems.length})
        </div>
        {isFinalized && <Lock className="w-3.5 h-3.5 text-slate-400" />}
      </div>

      {!spellReady && (
        <CheckStateBox
          status={spellStatus}
          errorMessage={record.spellErrorMessage || record.errorMessage}
          label="chính tả"
          canRetry={!isFinalized && canReview}
          isRetrying={isRerunningSpell}
          onRetry={handleRerunSpell}
        />
      )}

      {spellReady && (
      <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y">
        {spellItems.length === 0 && (
          <div className="px-3 py-2 text-xs text-slate-400">Không phát hiện lỗi chính tả</div>
        )}
        {spellGroups.map((group) => {
          const groupKey = group.token;
          const isExpanded = Boolean(expandedTokens[groupKey]);
          const allConfirmed = group.confirmedCount === group.items.length;
          const noneConfirmed = group.confirmedCount === 0;
          return (
            <div key={groupKey}>
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={allConfirmed}
                  ref={(el) => {
                    if (el) el.indeterminate = !allConfirmed && !noneConfirmed;
                  }}
                  disabled={isFinalized || !canReview}
                  onChange={(e) => handleToggleGroup(group, e.target.checked)}
                />
                <button
                  type="button"
                  className="flex items-center gap-1 text-slate-700 font-medium"
                  onClick={() => toggleExpanded(groupKey)}
                >
                  {group.items.length > 1 ? (
                    isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                  ) : null}
                  {group.token}
                  <span className="text-slate-400 font-normal">x{group.items.length}</span>
                </button>
                {group.items.length === 1 && (
                  <button
                    type="button"
                    onClick={() => locateSpell(group.items[0])}
                    title="Xem ô này trên bảng"
                    className="text-slate-400 hover:text-blue-600 font-mono ml-auto flex items-center gap-1"
                  >
                    {group.items[0].sheetName && (
                      <FileSpreadsheet className="w-3 h-3" />
                    )}
                    {group.items[0].sheetName ? `${group.items[0].sheetName}!` : ''}{group.items[0].location}
                  </button>
                )}
              </div>
              {isExpanded && group.items.length > 1 && (
                <div className="pl-9 pb-1.5 space-y-1">
                  {group.items.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={item.confirmed}
                        disabled={isFinalized || !canReview}
                        onChange={(e) => handleToggle('SPELL', item.id, e.target.checked)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          locateSpell(item);
                        }}
                        title="Xem ô này trên bảng"
                        className="text-slate-400 hover:text-blue-600 font-mono flex items-center gap-1"
                      >
                        {item.sheetName && <FileSpreadsheet className="w-3 h-3" />}
                        {item.sheetName ? `${item.sheetName}!` : ''}{item.location}
                      </button>
                      {item.scenarioLabel && (
                        <span className="text-slate-400 italic">{item.scenarioLabel}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {spellReady && !isFinalized && canReview && (
        <div className="space-y-2">
          <SpellCheckWhitelist whitelist={activeWhitelist} onChange={setRerunWhitelist} />
          <Button type="button" size="sm" variant="outline" isLoading={isRerunningSpell} onClick={handleRerunSpell}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Kiểm tra lại chính tả
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <ClipboardCheck className="w-4 h-4" />
          QC chưa khớp ({confirmedQcCount}/{qcMismatchItems.length})
          <HelpTip id="qc-section" title="QC chưa khớp" align="start">
            <p>So sánh nội dung kịch bản với thông tin chuẩn của sản phẩm trong dự án.</p>
            <p>Tick để xác nhận một điểm là lỗi thật, bỏ tick nếu AI báo nhầm. Chỉ các mục đang tick mới được chốt vào báo cáo.</p>
            <p>Kết quả được chia theo batch, xem ngay từng batch khi nó chạy xong.</p>
          </HelpTip>
        </div>
      </div>

      {!qcReady && (
        <CheckStateBox
          status={qcStatus}
          errorMessage={record.qcErrorMessage || record.errorMessage}
          label="QC"
          canRetry={!isFinalized && canReview}
          isRetrying={isRerunningQc}
          onRetry={handleRerunQc}
        />
      )}

      {!qcReady && qcBatches.length > 0 && (
        <QcBatchPanel
          batches={qcBatches}
          reviewedItems={[]}
          settled={false}
          multiSheet={scopeSheets.length > 1}
          isFinalized={isFinalized}
          canReview={canReview}
          onToggle={(itemId, confirmed) => handleToggle('QC', itemId, confirmed)}
          onLocate={locateQc}
          canLocate={(item) => Boolean(locateQcItem(item))}
        />
      )}

      {qcReady && (
      <>
      {record.qcModels && (
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
            Đối chiếu: {record.qcModels.verify}
          </span>
          {record.qcModels.stats && record.qcModels.stats.total_blocks > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full">
              Lần quét gần nhất: dùng lại {record.qcModels.stats.reused_blocks}/{record.qcModels.stats.total_blocks} kịch bản không đổi
            </span>
          )}
          {record.qcModels.reviewerNote && (
            <span
              title={record.qcModels.reviewerNote}
              className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full max-w-xs truncate"
            >
              Ghi chú cho AI: {record.qcModels.reviewerNote}
            </span>
          )}
        </div>
      )}

      {record.qcSkippedReason && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">QC chưa được quét</div>
            <div>{record.qcSkippedReason}</div>
          </div>
        </div>
      )}

      {qcBatches.length > 0 ? (
        <QcBatchPanel
          batches={qcBatches}
          reviewedItems={qcMismatchItems}
          settled
          multiSheet={scopeSheets.length > 1}
          isFinalized={isFinalized}
          canReview={canReview}
          onToggle={(itemId, confirmed) => handleToggle('QC', itemId, confirmed)}
          onLocate={locateQc}
          canLocate={(item) => Boolean(locateQcItem(item))}
        />
      ) : (
        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y">
          {qcMismatchItems.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">
              {record.qcSkippedReason ? 'Chưa có kết quả đối chiếu QC' : 'Không phát hiện điểm chưa khớp'}
            </div>
          )}
          {qcMismatchItems.map((item) => (
            <QcMismatchRow
              key={item.id}
              item={item}
              disabled={isFinalized || !canReview}
              onToggle={(itemId, confirmed) => handleToggle('QC', itemId, confirmed)}
              onLocate={locateQc}
              canLocate={Boolean(locateQcItem(item))}
            />
          ))}
        </div>
      )}

      {qcNoteItems.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-600">
            Thông tin không có dữ liệu chuẩn để đối chiếu ({qcNoteItems.length})
          </summary>
          <div className="mt-1.5 border border-slate-100 rounded-xl bg-slate-50 divide-y divide-slate-100">
            {qcNoteItems.map((item) => (
              <div key={item.id} className="px-3 py-1.5 text-slate-400">
                {item.sheet_name ? `${item.sheet_name} · ` : ''}{item.product_ref || 'Không rõ sản phẩm'} · {item.attribute}: {item.claimed_value}
              </div>
            ))}
          </div>
        </details>
      )}

      {!isFinalized && canReview && (
        <div className="space-y-2">
          {projectId && (
            <Link
              to={`/projects/${projectId}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              <PackageSearch className="w-3.5 h-3.5" /> Thêm/cập nhật thông tin sản phẩm để đối chiếu
            </Link>
          )}
          <details className="text-xs" open={Boolean(qcNote)}>
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
              Ghi chú cho AI khi kiểm tra lại (tuỳ chọn)
            </summary>
            <div className="mt-1.5 space-y-1.5">
              <textarea
                value={qcNote}
                onChange={(e) => setQcNote(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Ví dụ: chú ý đơn vị dung tích; combo 2 sản phẩm tính theo bảng giá mới..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="text-[10px] text-slate-400">
                Chỉ để định hướng đối chiếu, AI vẫn lấy thông tin sản phẩm đã duyệt làm chuẩn. Có ghi chú thì các kịch bản đều được kiểm tra lại.
              </div>
              <label className="flex items-center gap-1.5 text-slate-600">
                <input type="checkbox" checked={qcRefresh} onChange={(e) => setQcRefresh(e.target.checked)} />
                Gọi lại AI cho cả kịch bản không đổi (không dùng kết quả đã lưu)
              </label>
            </div>
          </details>
          <div>
            <Button type="button" size="sm" variant="outline" isLoading={isRerunningQc} onClick={handleRerunQc}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Kiểm tra lại QC
            </Button>
          </div>
        </div>
      )}
      </>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
        {!isFinalized && canReview && (
          <Button type="button" size="sm" isLoading={isFinalizing} disabled={!canFinalize} onClick={handleFinalize}>
            Chốt kiểm tra
          </Button>
        )}
        {isFinalized && (
          <>
            <a
              href={`${BASE_URL}/task-result-checks/task/${taskId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Xuất PDF
            </a>
            <a
              href={`${BASE_URL}/task-result-checks/task/${taskId}/xlsx`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel (đã tô màu)
            </a>
          </>
        )}
      </div>
      {scopeSheets.length > 0 && previewSource && (
        <ScanScopePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Phạm vi quét của công việc"
          source={previewSource}
          sheets={scopeSheets}
          scenariosBySheet={scenariosBySheet}
          selectedScenarioIds={selectedScenarioIds}
          fixedRegions={scopeRegions}
          draftRegions={canRerunScoped ? rerunRegions : []}
          onDraftRegionsChange={canRerunScoped ? setRerunRegions : undefined}
          defaultTool="view"
          spellItems={spellItems}
          qcItems={qcMismatchItems}
          focus={previewFocus}
          footer={
            canRerunScoped ? (
              <>
                <span className="mr-auto text-xs text-slate-500">
                  {rerunRegions.length > 0 ? `${rerunRegions.length} vùng sẽ được quét lại` : 'Dùng công cụ Vẽ vùng để chọn vùng cần quét lại'}
                </span>
                <Button type="button" size="sm" variant="outline" isLoading={isRerunningScoped} disabled={rerunRegions.length === 0 || isAnyRunning} onClick={() => handleScopedRerun('SPELL')}>
                  Quét lại chính tả
                </Button>
                <Button type="button" size="sm" variant="outline" isLoading={isRerunningScoped} disabled={rerunRegions.length === 0 || isAnyRunning} onClick={() => handleScopedRerun('QC')}>
                  Quét lại QC
                </Button>
                <Button type="button" size="sm" isLoading={isRerunningScoped} disabled={rerunRegions.length === 0 || isAnyRunning} onClick={() => handleScopedRerun('BOTH')}>
                  Quét lại cả hai
                </Button>
              </>
            ) : null
          }
        />
      )}
    </div>
  );
};