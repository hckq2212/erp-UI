import { useState } from 'react';
import { FileSpreadsheet, Layers, BoxSelect, ChevronDown } from 'lucide-react';
import { regionRange } from '../../utils/sheetScope';

const COLLAPSED_COUNT = 6;

// Lưu ý: bảng màu `blue-*` của dự án đã được map sang màu cam thương hiệu (xem index.css).
const ScopeRow = ({ icon: Icon, label, count, children }) => (
  <div className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-5">
    <div className="flex shrink-0 items-center gap-2.5 sm:w-40 sm:pt-0.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-sm font-black text-blue-600">{count}</p>
      </div>
    </div>
    <div className="flex min-w-0 flex-1 flex-wrap gap-2">{children}</div>
  </div>
);

export const SubmittedScopeSummary = ({ result }) => {
  const [showAllScenarios, setShowAllScenarios] = useState(false);

  const sheetNames = result?.sheetNames || [];
  const scenarioLabels = result?.scenarioLabels || [];
  const regions = result?.scanScope?.regions || [];
  if (sheetNames.length === 0 && scenarioLabels.length === 0 && regions.length === 0) return null;

  const hiddenScenarios = Math.max(scenarioLabels.length - COLLAPSED_COUNT, 0);
  const visibleScenarios = showAllScenarios ? scenarioLabels : scenarioLabels.slice(0, COLLAPSED_COUNT);
  const showRegionSheet = sheetNames.length > 1;

  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400">Phạm vi đã nộp</p>
      <div className="divide-y divide-blue-100/70">
        {sheetNames.length > 0 && (
          <ScopeRow icon={FileSpreadsheet} label="Sheet" count={`${sheetNames.length} sheet`}>
            {sheetNames.map((name) => (
              <span
                key={name}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-gray-800"
                title={name}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">{name}</span>
              </span>
            ))}
          </ScopeRow>
        )}

        {scenarioLabels.length > 0 && (
          <ScopeRow icon={Layers} label="Kịch bản" count={`${scenarioLabels.length} kịch bản`}>
            {visibleScenarios.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="inline-flex max-w-full items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-2.5 py-1.5 text-xs font-semibold text-gray-700"
                title={label}
              >
                <span className="mt-px flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-blue-600 px-1 text-[10px] font-black text-white">
                  {index + 1}
                </span>
                <span className="min-w-0 break-words">{label}</span>
              </span>
            ))}
            {hiddenScenarios > 0 && (
              <button
                type="button"
                onClick={() => setShowAllScenarios((value) => !value)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-dashed border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
              >
                {showAllScenarios ? 'Thu gọn' : `+${hiddenScenarios} kịch bản khác`}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllScenarios ? 'rotate-180' : ''}`} />
              </button>
            )}
          </ScopeRow>
        )}

        {regions.length > 0 && (
          <ScopeRow icon={BoxSelect} label="Vùng tự chọn" count={`${regions.length} vùng`}>
            {regions.map((region) => (
              <span
                key={`${region.sheet}:${region.id}`}
                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs"
              >
                <span className="font-bold text-gray-800">{region.label || 'Vùng'}</span>
                <code className="rounded-md border border-blue-200 bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                  {regionRange(region)}
                </code>
                {showRegionSheet && <span className="truncate text-[11px] font-medium text-gray-500">{region.sheet}</span>}
                {region.qc === false && <span className="text-[10px] font-bold uppercase text-gray-400">không QC</span>}
              </span>
            ))}
          </ScopeRow>
        )}
      </div>
    </div>
  );
};
