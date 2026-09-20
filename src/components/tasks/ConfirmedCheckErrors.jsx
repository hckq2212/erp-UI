import { AlertCircle } from 'lucide-react';

const groupSpellErrors = (items) => {
    const map = new Map();
    (items || []).forEach((item) => {
        if (!map.has(item.token)) map.set(item.token, { token: item.token, sheetName: item.sheetName, scenarioLabel: item.scenarioLabel, locations: [] });
        map.get(item.token).locations.push(item.location);
    });
    return Array.from(map.values());
};

export const ConfirmedCheckErrors = ({ spellErrors, qcMismatches, title = 'Lỗi đã chốt ở bản nộp trước' }) => {
    const hasSpell = spellErrors && spellErrors.length > 0;
    const hasQc = qcMismatches && qcMismatches.length > 0;
    if (!hasSpell && !hasQc) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {groupSpellErrors(spellErrors).map((g, gIdx) => (
                    <div key={`spell-${gIdx}`} className="px-3 py-2 text-xs flex items-center justify-between gap-2">
                        <span className="font-bold text-red-600">{g.token}</span>
                        <span className="text-gray-400 font-mono">
                            {g.sheetName ? `${g.sheetName}!` : ''}{g.locations.join(', ')}
                            {g.scenarioLabel ? ` (${g.scenarioLabel})` : ''}
                        </span>
                    </div>
                ))}
                {(qcMismatches || []).map((m, mIdx) => (
                    <div key={`qc-${mIdx}`} className="px-3 py-2 text-xs space-y-0.5">
                        <div className="font-bold text-orange-600">
                            {m.sheet_name ? `${m.sheet_name}${m.scenario ? ` / ${m.scenario}` : ''} · ` : ''}{m.product_ref || 'Không rõ sản phẩm'} · {m.attribute}
                        </div>
                        <div className="text-gray-500">{m.claimed_value} → {m.expected_value ?? 'không tìm thấy'}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
