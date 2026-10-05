import { useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ClipboardCheck, FileSpreadsheet, Lock, ShieldAlert, SpellCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/format';
import { QcMismatchRow } from './QcBatchPanel';

const MAX_VISIBLE_LOCATIONS = 6;

const groupSpellErrors = (items) => {
    const map = new Map();
    (items || []).forEach((item) => {
        if (!map.has(item.token)) map.set(item.token, { token: item.token, items: [] });
        map.get(item.token).items.push(item);
    });
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
};

const locationLabel = (item) => `${item.sheetName ? `${item.sheetName}!` : ''}${item.location}`;

const CountBadge = ({ children }) => (
    <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">{children}</span>
);

const SpellGroupRow = ({ group }) => {
    const [expanded, setExpanded] = useState(false);
    const total = group.items.length;
    const visible = expanded ? group.items : group.items.slice(0, MAX_VISIBLE_LOCATIONS);
    const hidden = total - visible.length;
    const single = total === 1 ? group.items[0] : null;

    return (
        <div className="px-3 py-2 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
                <span className="font-bold text-red-600 break-all">{group.token}</span>
                {total > 1 && <CountBadge>x{total}</CountBadge>}
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {visible.map((item, idx) => (
                    <span
                        key={`${item.id ?? 'item'}-${idx}`}
                        title={item.scenarioLabel || undefined}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-500"
                    >
                        {item.sheetName && <FileSpreadsheet className="w-3 h-3 shrink-0" />}
                        {locationLabel(item)}
                    </span>
                ))}
                {hidden > 0 && (
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="px-1.5 py-0.5 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                        +{hidden} vị trí
                    </button>
                )}
                {expanded && total > MAX_VISIBLE_LOCATIONS && (
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="px-1.5 py-0.5 text-[11px] font-bold text-slate-400 hover:text-slate-600"
                    >
                        Thu gọn
                    </button>
                )}
            </div>
            {single?.scenarioLabel && <div className="text-slate-400 italic">{single.scenarioLabel}</div>}
        </div>
    );
};

const ErrorColumn = ({ icon: Icon, title, count, className, children }) => (
    <section className={cn('min-w-0 space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Icon className="w-4 h-4" />
            {title}
            <CountBadge>{count}</CountBadge>
        </div>
        <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
            {children}
        </div>
    </section>
);

export const ConfirmedCheckErrors = ({
    spellErrors,
    qcMismatches,
    title = 'Lỗi đã chốt ở bản nộp trước',
    collapsible = false,
    variant = 'inline',
    finalizedAt,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const spellGroups = useMemo(() => groupSpellErrors(spellErrors), [spellErrors]);
    const spellCount = spellErrors?.length || 0;
    const qcCount = qcMismatches?.length || 0;
    if (spellCount === 0 && qcCount === 0) return null;

    const hasBoth = spellCount > 0 && qcCount > 0;
    const isSection = variant === 'section';

    const summary = (
        <span className="flex flex-wrap items-center gap-1.5">
            {spellCount > 0 && <CountBadge>{spellCount} lỗi chính tả</CountBadge>}
            {qcCount > 0 && <CountBadge>{qcCount} QC chưa khớp</CountBadge>}
            {finalizedAt && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Lock className="w-3 h-3" /> Chốt lúc {formatDateTime(finalizedAt)}
                </span>
            )}
        </span>
    );

    const headerContent = isSection ? (
        <span className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <ShieldAlert className="w-5 h-5" />
            </span>
            <span className="min-w-0 space-y-1 text-left">
                <span className="block text-xl font-bold text-gray-900 tracking-tight">{title}</span>
                {summary}
            </span>
        </span>
    ) : (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            {summary}
        </span>
    );

    return (
        <div className={cn(isSection ? 'space-y-6' : 'space-y-2')}>
            {collapsible ? (
                <button
                    type="button"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    aria-expanded={!isCollapsed}
                    className="flex w-full items-center justify-between gap-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {headerContent}
                    <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', isCollapsed && '-rotate-90')} />
                </button>
            ) : (
                <div>{headerContent}</div>
            )}

            {!(collapsible && isCollapsed) && (
                <div className="@container p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className={cn('grid grid-cols-1 gap-4', hasBoth && '@lg:grid-cols-5')}>
                        {spellCount > 0 && (
                            <ErrorColumn
                                icon={SpellCheck}
                                title="Lỗi chính tả"
                                count={spellCount}
                                className={hasBoth ? '@lg:col-span-2' : undefined}
                            >
                                {spellGroups.map((group) => (
                                    <SpellGroupRow key={group.token} group={group} />
                                ))}
                            </ErrorColumn>
                        )}
                        {qcCount > 0 && (
                            <ErrorColumn
                                icon={ClipboardCheck}
                                title="QC chưa khớp"
                                count={qcCount}
                                className={hasBoth ? '@lg:col-span-3' : undefined}
                            >
                                {qcMismatches.map((item, idx) => (
                                    <QcMismatchRow key={`${item.id ?? 'qc'}-${idx}`} item={item} readOnly />
                                ))}
                            </ErrorColumn>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
