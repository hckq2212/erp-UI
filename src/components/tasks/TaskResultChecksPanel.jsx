import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, SpellCheck, ClipboardCheck, Download, FileSpreadsheet, Lock, RefreshCw, PackageSearch, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import { SpellCheckWhitelist } from './SpellCheckWhitelist';
import {
  useGetTaskResultCheckQuery,
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
  const { data: record, isLoading } = useGetTaskResultCheckQuery(taskId, {
    // SSE (task_result_check_updated -> 'TaskResultChecks' tag) pushes refetches in real time.
    // Keep a slow fallback poll only in case the SSE connection drops.
    pollingInterval: 30000,
    skip: !taskId,
  });
  const [toggleItem] = useToggleResultCheckItemMutation();
  const [toggleItems] = useToggleResultCheckItemsMutation();
  const [finalize, { isLoading: isFinalizing }] = useFinalizeResultCheckMutation();
  const [rerunSpell, { isLoading: isRerunningSpell }] = useRerunResultCheckMutation();
  const [rerunQc, { isLoading: isRerunningQc }] = useRerunResultCheckMutation();
  const [rerunWhitelist, setRerunWhitelist] = useState(null);
  const [expandedTokens, setExpandedTokens] = useState({});

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
  const confirmedSpellCount = spellItems.filter((i) => i.confirmed).length;
  const confirmedQcCount = qcMismatchItems.filter((i) => i.confirmed).length;
  const activeWhitelist = rerunWhitelist ?? record.reviewerWhitelist ?? [];

  const handleToggle = async (kind, itemId, confirmed) => {
    try {
      await toggleItem({ taskId, kind, itemId, confirmed }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể cập nhật mục kiểm tra');
    }
  };

  const handleToggleGroup = async (group, confirmed) => {
    try {
      await toggleItems({ taskId, kind: 'SPELL', itemIds: group.items.map((item) => item.id), confirmed }).unwrap();
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
      await rerunQc({ taskId, kind: 'QC', whitelist: activeWhitelist }).unwrap();
      toast.success('Đang kiểm tra lại QC...');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể kiểm tra lại QC');
    }
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
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
                  <span className="text-slate-400 font-mono ml-auto flex items-center gap-1">
                    {group.items[0].sheetName && (
                      <FileSpreadsheet className="w-3 h-3" />
                    )}
                    {group.items[0].sheetName ? `${group.items[0].sheetName}!` : ''}{group.items[0].location}
                  </span>
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
                      <span className="text-slate-400 font-mono flex items-center gap-1">
                        {item.sheetName && <FileSpreadsheet className="w-3 h-3" />}
                        {item.sheetName ? `${item.sheetName}!` : ''}{item.location}
                      </span>
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

      {qcReady && (
      <>
      {record.qcModels && (
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
            Đối chiếu: {record.qcModels.verify}
          </span>
        </div>
      )}

      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y">
        {qcMismatchItems.length === 0 && (
          <div className="px-3 py-2 text-xs text-slate-400">Không phát hiện điểm chưa khớp</div>
        )}
        {qcMismatchItems.map((item) => (
          <label key={item.id} className="flex items-start gap-2 px-3 py-1.5 text-xs">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={item.confirmed}
              disabled={isFinalized || !canReview}
              onChange={(e) => handleToggle('QC', item.id, e.target.checked)}
            />
            <div className="space-y-0.5">
              <div className="text-slate-700 font-medium">
                {item.sheet_name ? `${item.sheet_name}${item.scenario ? ` / ${item.scenario}` : ''} · ` : ''}{item.product_ref || 'Không rõ sản phẩm'} · {item.attribute}
              </div>
              <div className="text-slate-500">{item.claimed_value} → {item.expected_value ?? 'không tìm thấy'}</div>
              <div className="text-slate-400 italic">{item.reasoning}</div>
            </div>
          </label>
        ))}
      </div>

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
    </div>
  );
};