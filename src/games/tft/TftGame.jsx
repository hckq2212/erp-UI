import { useCallback, useEffect, useRef, useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins, Heart, Loader2, RefreshCw, Swords, TrendingUp, Trash2, Trophy, WifiOff } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTftStore, tftApi } from './useTftStore';
import { BattleView } from './BattleView';
import { COST_STYLE, UnitChip, btnGhost, btnPrimary, sellPrice, unitTip } from './parts';

/** Vini Tactics — auto-battler nhẹ, chơi 1 mình (PvE). Mọi luật chạy ở máy chủ. */
export default function TftGame() {
  const connect = useTftStore((s) => s.connect);
  const disconnect = useTftStore((s) => s.disconnect);
  const connected = useTftStore((s) => s.connected);
  const catalog = useTftStore((s) => s.catalog);
  const state = useTftStore((s) => s.state);
  const battle = useTftStore((s) => s.battle);

  useEffect(() => { connect(); return () => disconnect(); }, [connect, disconnect]);

  if (!catalog) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-primary">
        {connected ? <Loader2 className="h-6 w-6 animate-spin" /> : <WifiOff className="h-6 w-6" />}
        <span className="text-sm text-gray-500">{connected ? 'Đang tải…' : 'Đang kết nối máy chủ…'}</span>
      </div>
    );
  }
  if (battle) return <BattleView />;
  if (!state) return <Lobby />;
  if (state.status === 'shop') return <ShopPhase />;
  return <Result />;
}

// ---------------------------------------------------------------- Sảnh
function Lobby() {
  const start = useTftStore((s) => s.start);
  const error = useTftStore((s) => s.error);
  const catalog = useTftStore((s) => s.catalog);
  const [me, setMe] = useState(null);
  const [board, setBoard] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    tftApi.get('/tft/me').then((r) => setMe(r.data)).catch(() => {});
    tftApi.get('/tft/leaderboard').then((r) => setBoard(r.data || [])).catch(() => {});
  }, []);

  const total = catalog.consts.totalRounds;
  const roundText = (n) => (n > total ? `Vượt hết ${total} vòng` : `Vòng ${n}`);

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-6">
      <div className="rounded-3xl border border-primary-100 bg-white p-6 text-center shadow-sm">
        <div className="text-5xl">⚔️</div>
        <h1 className="mt-2 text-2xl font-black text-gray-900">Vini Tactics</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Mua đồng nghiệp ở cửa hàng, xếp đội hình rồi để họ tự đánh. Vượt {total} vòng “thử thách công sở”
          mà chưa hết {catalog.consts.lives} mạng để chiến thắng. Gộp 3 quân giống nhau để lên sao, ghép cùng phòng ban để kích hoạt sức mạnh.
        </p>
        <button type="button" disabled={busy} className={cn(btnPrimary, 'mt-4 px-6 py-3 text-base')}
          onClick={async () => { setBusy(true); await start(); setBusy(false); }}>
          <Swords className="mr-1.5 inline h-4 w-4" />Bắt đầu lượt chơi mới
        </button>
        {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      </div>

      {me && (
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Lượt đã chơi', me.runs], ['Xa nhất', me.bestRound ? roundText(me.bestRound) : '—'], ['Vượt hết', me.cleared]].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-primary-100 bg-white p-3">
              <div className="text-lg font-black text-primary-700">{v}</div>
              <div className="text-xs font-semibold text-gray-500">{l}</div>
            </div>
          ))}
        </div>
      )}

      {board.length > 0 && (
        <div className="rounded-2xl border border-primary-100 bg-white p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black text-gray-800"><Trophy className="h-4 w-4 text-primary" />Bảng xếp hạng</h2>
          <ol className="space-y-1 text-sm">
            {board.slice(0, 10).map((p, i) => (
              <li key={p.accountId} className="flex items-center justify-between gap-2">
                <span className="truncate"><span className="mr-2 inline-block w-5 text-gray-400">{i + 1}</span>{p.username || 'Ẩn danh'}</span>
                <span className="shrink-0 font-semibold text-primary-700">{roundText(Number(p.bestRound))}{Number(p.cleared) > 0 && ` · ${p.cleared}🏆`}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <UnitGuide />
    </div>
  );
}

// ---------------------------------------------------------------- Danh sách quân & trait
function UnitGuide() {
  const catalog = useTftStore((s) => s.catalog);
  const traitMap = useTftStore((s) => s.traitMap);
  return (
    <details className="rounded-2xl border border-primary-100 bg-white p-4 text-sm">
      <summary className="cursor-pointer font-black text-gray-800">Danh sách quân &amp; phòng ban</summary>
      <div className="mt-3 space-y-1.5">
        {catalog.traits.map((t) => (
          <div key={t.id} className="text-gray-600"><b>{t.emoji} {t.name}</b> ({t.thresholds.join('/')} quân khác nhau): {t.desc}</div>
        ))}
      </div>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {catalog.units.map((u) => (
          <div key={u.key} className="flex items-center gap-2 rounded-xl bg-gray-50 p-1.5" title={unitTip(u, 1)}>
            <UnitChip def={u} small />
            <div className="min-w-0 text-xs">
              <div className="font-bold text-gray-800">{u.name} <span className={COST_STYLE[u.cost].text}>· {u.cost}🪙</span> <span className="text-gray-400">{traitMap[u.trait]?.emoji}</span></div>
              <div className="truncate text-gray-500">{u.spell.text}</div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------- Giai đoạn mua/xếp
/** Quân xuất hiện thì bật nảy ra; lên sao thì loé một vòng vàng. Tôn trọng prefers-reduced-motion. */
function UnitPop({ unit, children }) {
  const reduce = useReducedMotion();
  const prevStar = useRef(unit.star);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (unit.star > prevStar.current) setBurst((b) => b + 1);
    prevStar.current = unit.star;
  }, [unit.star]);
  return (
    <motion.div className="relative h-full w-full" initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
      {children}
      {burst > 0 && !reduce && (
        <motion.span key={burst} aria-hidden className="pointer-events-none absolute inset-0 rounded-xl border-4 border-amber-400"
          initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 0.6 }} />
      )}
    </motion.div>
  );
}

/** Ô sân/hàng chờ: vừa là điểm thả (droppable) vừa là quân kéo được (draggable). Bấm để chọn vẫn dùng được như cũ. */
function DndSlot({ z, i, unit, def, selected, onClick }) {
  const id = `${z}:${i}`;
  const { setNodeRef: dropRef, isOver } = useDroppable({ id });
  const { setNodeRef: dragRef, listeners, isDragging } = useDraggable({ id, disabled: !unit });
  const setRef = useCallback((node) => { dropRef(node); dragRef(node); }, [dropRef, dragRef]); // ref ổn định, tránh dnd-kit đo lại mỗi lần render
  return (
    <button type="button" ref={setRef} {...listeners} onClick={onClick}
      aria-label={def ? `${def.name}, ${unit.star} sao` : 'Ô trống'}
      className={cn('block aspect-square w-full touch-manipulation rounded-xl border-2 border-dashed p-0.5 transition',
        selected ? 'border-primary bg-primary-50' : 'border-primary-100 bg-white hover:border-primary-300',
        unit && 'cursor-grab active:cursor-grabbing',
        isOver && 'scale-105 border-primary bg-primary-50 ring-2 ring-primary/40')}>
      {unit && def && <UnitPop unit={unit}><UnitChip def={def} star={unit.star} selected={selected} dim={isDragging} /></UnitPop>}
    </button>
  );
}

/** Vùng bán: luôn được gắn sẵn (để dnd-kit đo được vị trí) nhưng chỉ hiện khi đang kéo. Cố định ở đáy nên không làm xô lệch bố cục. */
function SellZone({ active, price }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'sell' });
  return (
    <div ref={setNodeRef} aria-hidden={!active}
      className={cn('pointer-events-none fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm font-black shadow-lg transition',
        active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        isOver ? 'scale-105 border-red-500 bg-red-500 text-white' : 'border-red-300 bg-white text-red-600')}>
      <Trash2 className="h-4 w-4" />{isOver ? `Thả để bán +${price}🪙` : `Kéo vào đây để bán (+${price}🪙)`}
    </div>
  );
}

function ShopPhase() {
  const s = useTftStore((x) => x.state);
  const unitMap = useTftStore((x) => x.unitMap);
  const traitMap = useTftStore((x) => x.traitMap);
  const catalog = useTftStore((x) => x.catalog);
  const error = useTftStore((x) => x.error);
  const { buy, sell, move, reroll, buyXp, fight, abandon, clearError } = useTftStore.getState();
  const [sel, setSel] = useState(null);
  const [fighting, setFighting] = useState(false);
  const [dragId, setDragId] = useState(null);
  const reduce = useReducedMotion();
  // chuột: kéo quá 6px mới tính là kéo (dưới ngưỡng vẫn là bấm chọn); cảm ứng: giữ 150ms để không cản việc cuộn trang
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );
  const parseId = (id) => { const [z, i] = String(id).split(':'); return { z, i: Number(i) }; };

  const { boardCols: cols, boardRows: rows, rerollCost, xpCost, maxLevel } = catalog.consts;
  const at = (l) => (l.z === 'bench' ? s.bench : s.board)[l.i];
  const onBoard = s.board.filter(Boolean).length;

  useEffect(() => { if (sel && !at(sel)) setSel(null); }); // quân đã bị gộp/bán thì bỏ chọn
  useEffect(() => { if (!error) return undefined; const t = setTimeout(clearError, 3500); return () => clearTimeout(t); }, [error, clearError]);

  const clickSlot = async (z, i) => {
    if (!sel) { if (at({ z, i })) setSel({ z, i }); return; }
    if (sel.z === z && sel.i === i) { setSel(null); return; }
    const from = sel;
    setSel(null);
    await move(from, { z, i });
  };

  const doFight = async () => { setFighting(true); await fight(); setFighting(false); };
  const selUnit = sel && at(sel);

  const dragFrom = dragId ? parseId(dragId) : null;
  const dragUnit = dragFrom && at(dragFrom);
  const dragDef = dragUnit && unitMap[dragUnit.key];
  const onDragStart = ({ active }) => { setSel(null); setDragId(active.id); };
  const onDragCancel = () => setDragId(null);
  const onDragEnd = async ({ active, over }) => {
    setDragId(null);
    if (!over || over.id === active.id) return;
    const from = parseId(active.id);
    if (over.id === 'sell') await sell(from);
    else await move(from, parseId(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
    <div className="mx-auto max-w-xl space-y-3 p-3 md:p-6">
      {/* Thanh trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary-100 bg-white px-4 py-2.5 text-sm font-bold">
        <span className="text-gray-900">Vòng {s.round}/{s.totalRounds}</span>
        <span className="flex items-center gap-0.5 text-red-500">{Array.from({ length: catalog.consts.lives }, (_, i) => <Heart key={i} className={cn('h-4 w-4', i < s.lives ? 'fill-current' : 'opacity-25')} />)}</span>
        <span className="flex items-center gap-1 text-amber-600"><Coins className="h-4 w-4" />{s.gold}{s.interest > 0 && <span className="text-xs font-semibold text-amber-500">(+{s.interest} lãi)</span>}</span>
        <span className="flex items-center gap-1.5 text-primary-700">
          Cấp {s.level}
          {s.xpNeed > 0 && <span className="relative h-2 w-14 overflow-hidden rounded-full bg-primary-100"><span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${(s.xp / s.xpNeed) * 100}%` }} /></span>}
        </span>
        {s.streak !== 0 && <span className={cn('flex items-center gap-0.5 text-xs', s.streak > 0 ? 'text-green-600' : 'text-gray-400')}><TrendingUp className="h-3.5 w-3.5" />{Math.abs(s.streak)} {s.streak > 0 ? 'thắng' : 'thua'} liên tiếp</span>}
      </div>

      {error && <div onClick={clearError} className="cursor-pointer rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</div>}

      {/* Xem trước đối thủ */}
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2">
        <span className="shrink-0 text-xs font-black uppercase text-red-500">Đối thủ</span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-800">{s.enemy.name}</span>
        <span className="flex shrink-0 gap-1">{s.enemy.units.map((u, i) => <UnitChip key={i} def={unitMap[u.key]} star={u.star} small />)}</span>
      </div>

      {/* Sân */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-500">
          <span>Sân · hàng trên đứng gần đối thủ · kéo để đổi chỗ</span>
          <span className={cn(onBoard < s.level && 'text-amber-600')}>{onBoard}/{s.level} quân</span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols * rows }, (_, i) => {
            const u = s.board[i];
            return <DndSlot key={i} z="board" i={i} unit={u} def={u && unitMap[u.key]} selected={sel?.z === 'board' && sel.i === i} onClick={() => clickSlot('board', i)} />;
          })}
        </div>
      </div>

      {/* Phòng ban đang kích hoạt */}
      <div className="flex min-h-7 flex-wrap gap-1.5">
        {s.traits.length === 0 && <span className="text-xs text-gray-400">Xếp các quân khác phòng ban/vai trò để kích hoạt sức mạnh.</span>}
        {s.traits.map((t) => {
          const def = traitMap[t.id];
          const next = def.thresholds.find((th) => th > t.count) ?? def.thresholds[def.thresholds.length - 1];
          return (
            <span key={t.id} title={`${def.desc}\nMốc: ${def.thresholds.join(' / ')}`}
              className={cn('rounded-full px-2.5 py-1 text-xs font-bold', t.tier >= 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500')}>
              {def.emoji} {def.name} {t.count}/{next}
            </span>
          );
        })}
      </div>

      {/* Hàng chờ */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-500">
          <span>Hàng chờ</span>
          {selUnit && (
            <button type="button" onClick={async () => { const l = sel; setSel(null); await sell(l); }} className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-0.5 text-red-600 hover:bg-red-100">
              <Trash2 className="h-3.5 w-3.5" />Bán {unitMap[selUnit.key].name}
            </button>
          )}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {s.bench.map((u, i) => (
            <DndSlot key={i} z="bench" i={i} unit={u} def={u && unitMap[u.key]} selected={sel?.z === 'bench' && sel.i === i} onClick={() => clickSlot('bench', i)} />
          ))}
        </div>
      </div>

      {/* Cửa hàng */}
      <div className="rounded-2xl border border-primary-100 bg-white p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {s.shop.map((key, i) => {
            const def = key && unitMap[key];
            const cant = def && s.gold < def.cost;
            return (
              <motion.button key={`${i}:${key}`} type="button" disabled={!def || cant} onClick={() => buy(i)} title={def ? unitTip(def, 1) : ''}
                initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileTap={def && !cant && !reduce ? { scale: 0.94 } : undefined}
                className={cn('flex aspect-[3/4] flex-col items-center justify-between rounded-xl border-2 p-1 text-center transition',
                  def ? cn(COST_STYLE[def.cost].ring, COST_STYLE[def.cost].bg, cant ? 'opacity-50' : 'hover:-translate-y-0.5') : 'border-dashed border-gray-200 bg-gray-50')}>
                {def && (<>
                  <span className="text-[10px] font-bold text-gray-500">{traitMap[def.trait]?.emoji}</span>
                  <span className="text-2xl sm:text-3xl">{def.emoji}</span>
                  <span className="w-full truncate text-[10px] font-bold text-gray-800">{def.name}</span>
                  <span className={cn('text-xs font-black', COST_STYLE[def.cost].text)}>{def.cost}🪙</span>
                </>)}
              </motion.button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" disabled={s.gold < rerollCost} onClick={reroll} className={cn(btnGhost, 'flex items-center gap-1 px-3 py-1.5')}>
            <RefreshCw className="h-3.5 w-3.5" />Làm mới {rerollCost}🪙
          </button>
          <button type="button" disabled={s.gold < xpCost || s.level >= maxLevel} onClick={buyXp} className={cn(btnGhost, 'px-3 py-1.5')}>
            {s.level >= maxLevel ? 'Cấp tối đa' : `Mua XP ${xpCost}🪙`}
          </button>
          <button type="button" disabled={fighting || onBoard === 0} onClick={doFight} className={cn(btnPrimary, 'ml-auto flex items-center gap-1.5 px-5')}>
            <Swords className="h-4 w-4" />Chiến đấu!
          </button>
        </div>
      </div>

      <div className="text-right">
        <button type="button" onClick={() => { if (window.confirm('Bỏ lượt chơi này?')) abandon(); }} className="text-xs font-semibold text-gray-400 hover:text-red-500">Bỏ lượt chơi</button>
      </div>
    </div>

    <SellZone active={!!dragUnit} price={dragUnit && dragDef ? sellPrice(dragDef, dragUnit.star) : 0} />
    {/* dropAnimation tắt vì state được cập nhật lạc quan: quân hiện ngay ở ô mới, không cần hoạt ảnh bay về */}
    <DragOverlay dropAnimation={null}>
      {dragUnit && dragDef && <UnitChip def={dragDef} star={dragUnit.star} className={cn('shadow-xl', !reduce && 'scale-110')} />}
    </DragOverlay>
    </DndContext>
  );
}

// ---------------------------------------------------------------- Kết quả lượt chơi
function Result() {
  const s = useTftStore((x) => x.state);
  const start = useTftStore((x) => x.start);
  const abandon = useTftStore((x) => x.abandon);
  const won = s.status === 'won';
  return (
    <div className="mx-auto max-w-md space-y-4 p-6 text-center">
      <div className="rounded-3xl border border-primary-100 bg-white p-8 shadow-sm">
        <div className="text-6xl">{won ? '🏆' : '🪦'}</div>
        <h2 className="mt-2 text-2xl font-black text-gray-900">{won ? 'Chiến thắng!' : 'Lượt chơi kết thúc'}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {won ? `Bạn đã vượt qua cả ${s.totalRounds} vòng.` : `Bạn dừng ở vòng ${s.round}/${s.totalRounds}.`} Thắng {s.wins} trận.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={start} className={btnPrimary}>Chơi lại</button>
          <button type="button" onClick={() => abandon()} className={btnGhost}>Về sảnh</button>
        </div>
      </div>
    </div>
  );
}
