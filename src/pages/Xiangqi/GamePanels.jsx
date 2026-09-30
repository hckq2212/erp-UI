import { useMemo } from 'react';
import { Swords, Loader2, Bot, ShieldAlert, Clock, WifiOff, Handshake, Crown, Flag } from 'lucide-react';
import { cn } from '../../utils/cn';
import { pieceLabel } from './Board';
import { analyzeMaterial, balanceSeries, advantageLabel, PIECE_ORDER, PIECE_NAME } from './material';

const TONES = {
  turn: 'border-primary bg-primary-50 text-primary-800',
  wait: 'border-gray-200 bg-gray-50 text-gray-700',
  danger: 'border-red-400 bg-red-50 text-red-700',
  warn: 'border-amber-400 bg-amber-50 text-amber-800',
  info: 'border-sky-300 bg-sky-50 text-sky-800',
  success: 'border-green-400 bg-green-50 text-green-800',
  neutral: 'border-gray-300 bg-gray-100 text-gray-700',
};
const ICONS = { swords: Swords, loader: Loader2, bot: Bot, shield: ShieldAlert, clock: Clock, wifiOff: WifiOff, handshake: Handshake, crown: Crown, flag: Flag };

/** Khung trạng thái ván: luôn hiện đúng MỘT thông điệp quan trọng nhất (xem gameStatus.js). */
export function StatusBanner({ status }) {
  if (!status) return null;
  const Icon = ICONS[status.icon] || Swords;
  const spin = status.icon === 'loader';
  return (
    <div role={status.tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-2xl border-2 p-4 transition-colors duration-300', TONES[status.tone])}>
      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70', status.tone === 'danger' && 'xq-dot')}>
        <Icon className={cn('h-5 w-5', spin && 'animate-spin')} />
      </span>
      <div key={status.title} className="xq-enter min-w-0">
        <p className="flex items-center gap-2 text-sm font-extrabold">
          {status.title}
          {status.tone === 'turn' && <span className="xq-dot h-2 w-2 rounded-full bg-primary" />}
        </p>
        {status.detail && <p className="mt-0.5 text-xs font-medium opacity-80">{status.detail}</p>}
      </div>
    </div>
  );
}

const fmtScore = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const COLOR = { r: '#C2260C', b: '#3B2A20' };

function Captured({ label, color, lost, vietnamese }) {
  const items = PIECE_ORDER.filter((t) => lost[t] > 0);
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="w-24 shrink-0 pt-1 text-gray-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.length ? items.map((t) => (
          <span key={t} className="rounded-md border px-1.5 py-0.5 font-bold" style={{ color: COLOR[color], borderColor: COLOR[color] + '55' }}>
            {pieceLabel(color + t, vietnamese)}{lost[t] > 1 ? ` ×${lost[t]}` : ''}
          </span>
        )) : <span className="pt-1 text-gray-400">Chưa ăn quân nào</span>}
      </div>
    </div>
  );
}

function Sparkline({ series }) {
  const W = 300, H = 56, mid = H / 2;
  const max = Math.max(4, ...series.map(Math.abs));
  const pts = series.map((v, i) => [(i / (series.length - 1)) * W, mid - (v / max) * (mid - 5)]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-14 w-full" role="img" aria-label="Diễn biến lực lượng theo nước đi">
      <line x1="0" x2={W} y1={mid} y2={mid} stroke="#FED7AA" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,${mid} ${line} ${W},${mid}`} fill="#F38820" opacity=".14" />
      <polyline points={line} fill="none" stroke="#EA580C" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="3.5" fill="#EA580C" />
    </svg>
  );
}

/**
 * Tương quan lực lượng (góc nhìn của người chơi: dương = bạn hơn).
 * Điểm: Xe 9 · Pháo 4.5 · Mã 4 · Tượng 2 · Sĩ 2 · Tốt 1 (qua sông 2). Tướng không tính.
 */
export function MaterialPanel({ board, moves, myColor = 'r', meLabel = 'Bạn', oppLabel = 'Đối thủ', vietnamese = false }) {
  const opp = myColor === 'r' ? 'b' : 'r';
  const a = useMemo(() => analyzeMaterial(board), [board]);
  const series = useMemo(() => balanceSeries(moves), [moves]);
  const me = a[myColor], ot = a[opp];
  const d = me.score - ot.score;
  const total = me.score + ot.score;
  const share = total ? (me.score / total) * 100 : 50;
  const mySeries = myColor === 'r' ? series : series.map((v) => -v);
  const verdictTone = Math.abs(d) < 0.5 ? 'bg-gray-100 text-gray-600' : d > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  const verdict = Math.abs(d) < 0.5 ? 'Cân bằng' : `${d > 0 ? meLabel : oppLabel} ${advantageLabel(d).toLowerCase()} (${d > 0 ? '+' : '−'}${fmtScore(Math.abs(d))})`;

  const rows = [
    ...PIECE_ORDER.map((t) => [PIECE_NAME[t], me.counts[t], ot.counts[t]]),
    ['Tốt qua sông', me.crossed, ot.crossed],
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-primary-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-extrabold text-gray-900">Tương quan lực lượng</h4>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors', verdictTone)}>{verdict}</span>
      </div>

      <div>
        <div className="flex h-6 overflow-hidden rounded-full text-[11px] font-bold text-white">
          <div className="flex items-center pl-2 transition-all duration-500" style={{ width: `${share}%`, background: COLOR[myColor], minWidth: 28 }}>{fmtScore(me.score)}</div>
          <div className="flex flex-1 items-center justify-end pr-2 transition-all duration-500" style={{ background: COLOR[opp], minWidth: 28 }}>{fmtScore(ot.score)}</div>
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-gray-500"><span>{meLabel} · {me.pieces} quân</span><span>{oppLabel} · {ot.pieces} quân</span></div>
      </div>

      <div className="space-y-1.5">
        <Captured label={`${meLabel} đã ăn`} color={opp} lost={ot.lost} vietnamese={vietnamese} />
        <Captured label={`${oppLabel} đã ăn`} color={myColor} lost={me.lost} vietnamese={vietnamese} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0.5 rounded-xl bg-primary-50 px-3 py-2 text-center text-xs">
        {rows.map(([name, x, y]) => (
          <div key={name} className="contents">
            <span className={cn('tabular-nums', x > y ? 'font-extrabold text-primary-700' : 'text-gray-500')}>{x}</span>
            <span className="text-gray-500">{name}</span>
            <span className={cn('tabular-nums', y > x ? 'font-extrabold text-primary-700' : 'text-gray-500')}>{y}</span>
          </div>
        ))}
      </div>

      <div>
        {mySeries.length > 1
          ? <Sparkline series={mySeries} />
          : <p className="py-3 text-center text-xs text-gray-400">Biểu đồ diễn biến sẽ hiện sau nước đi đầu tiên</p>}
        <p className="text-[11px] text-gray-400">Diễn biến theo từng nước · phía trên đường đứt là {meLabel.toLowerCase()} hơn</p>
      </div>
    </div>
  );
}
