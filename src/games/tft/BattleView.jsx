import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useTftStore } from './useTftStore';
import { btnGhost, btnPrimary } from './parts';

const COLS = 5;
const ROWS = 6;
const TICK_MS = 100; // 1 tick = 100ms, khớp server

const SPELL_FX = { aoe: '💥', stun: '💫', heal: '💚', buff: '🔥', shield: '🛡️' };
const SPELL_NAME = { aoe: 'Bùng nổ!', stun: 'Choáng!', heal: 'Hồi máu', buff: 'Tăng lực!', shield: 'Khiên' };
// Class Tailwind viết đầy đủ để bộ quét nhận ra
const SPELL_RING = { aoe: 'border-orange-400', stun: 'border-yellow-400', heal: 'border-green-400', buff: 'border-amber-500', shield: 'border-sky-400' };
const LUNGE = 32; // % bề rộng ô mà quân cận chiến lao tới
const centerPct = (r, c) => ({ left: `${((c + 0.5) * 100) / COLS}%`, top: `${((r + 0.5) * 100) / ROWS}%` });

/**
 * Phát lại trận đã được máy chủ mô phỏng sẵn. Client KHÔNG tính gì: chỉ áp từng sự kiện
 * (di chuyển / đánh / chiêu / chết) theo tick, nên không thể lệch kết quả với server.
 */
export function BattleView() {
  const battle = useTftStore((s) => s.battle);
  const unitMap = useTftStore((s) => s.unitMap);
  const reduce = useReducedMotion();
  const finishBattle = useTftStore((s) => s.finishBattle);
  const b = battle.battle;

  const sim = useRef(null);
  if (!sim.current) {
    sim.current = { t: 0, idx: 0, units: Object.fromEntries(b.units.map((u) => [u.id, { ...u, hp: u.maxHp, alive: true }])) };
  }
  const fxSeq = useRef(0);
  const [, force] = useState(0);
  const [fx, setFx] = useState([]);
  const [speed, setSpeed] = useState(1);
  const [done, setDone] = useState(false);

  const pushFx = (list) => {
    if (!list.length) return;
    setFx((cur) => [...cur, ...list]);
    const ids = new Set(list.map((f) => f.id));
    setTimeout(() => setFx((cur) => cur.filter((f) => !ids.has(f.id))), 800);
  };

  const advance = (withFx = true) => {
    const s = sim.current;
    s.t++;
    const list = [];
    const add = (u, text, cls) => list.push({ id: ++fxSeq.current, r: u.r, c: u.c, text, cls });
    const fancy = withFx && !reduce; // bỏ qua hiệu ứng khi "Bỏ qua" trận hoặc người dùng tắt chuyển động
    const dur = 0.22 / speed;
    while (s.idx < b.events.length && b.events[s.idx].t <= s.t) {
      const ev = b.events[s.idx++];
      const u = s.units[ev.id];
      if (ev.e === 'm') { u.r = ev.r; u.c = ev.c; }
      else if (ev.e === 'a') {
        const tg = s.units[ev.tg];
        tg.hp = ev.hp; add(tg, `-${ev.dmg}`, 'text-red-600');
        if (fancy) {
          tg.hit = (tg.hit || 0) + 1; // chớp trắng khi trúng đòn
          if ((unitMap[u.key]?.range ?? 1) > 1) {
            list.push({ id: ++fxSeq.current, kind: 'proj', from: { r: u.r, c: u.c }, to: { r: tg.r, c: tg.c }, side: u.side, dur });
          } else { // cận chiến: lao về phía mục tiêu rồi lùi lại
            const dx = tg.c - u.c, dy = tg.r - u.r, len = Math.hypot(dx, dy) || 1;
            u.lunge = { n: (u.lunge?.n || 0) + 1, x: (dx / len) * LUNGE, y: (dy / len) * LUNGE };
          }
        }
      }
      else if (ev.e === 's') {
        ev.tg.forEach((id, i) => {
          const x = s.units[id];
          if (ev.hp[i] != null) {
            const before = x.hp;
            x.hp = ev.hp[i];
            add(x, ev.sp === 'heal' ? `+${x.hp - before}` : `-${ev.v}`, ev.sp === 'heal' ? 'text-green-600' : 'text-red-600');
          }
          if (fancy) list.push({ id: ++fxSeq.current, kind: 'ring', r: x.r, c: x.c, cls: SPELL_RING[ev.sp] || 'border-primary' });
        });
        add(u, SPELL_FX[ev.sp] || '✨', 'text-xl');
        if (fancy) add(u, SPELL_NAME[ev.sp] || '', 'mt-[-14px] text-[11px] text-primary-700');
      } else if (ev.e === 'd') u.alive = false;
    }
    if (withFx) pushFx(list);
    if (s.t >= b.ticks && s.idx >= b.events.length) setDone(true);
    force((n) => n + 1);
  };

  useEffect(() => {
    if (done) return undefined;
    const id = setInterval(() => advance(), TICK_MS / speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, done]);

  const skip = () => { while (!done && sim.current.t < b.ticks) advance(false); setDone(true); };

  const units = Object.values(sim.current.units);
  const cellStyle = (r, c) => ({ left: `${(c * 100) / COLS}%`, top: `${(r * 100) / ROWS}%`, width: `${100 / COLS}%`, height: `${100 / ROWS}%` });
  const win = battle.win;

  return (
    <div className="mx-auto max-w-md space-y-3 p-3 md:p-6">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Vòng {b.round}</div>
        <h2 className="text-lg font-black text-gray-900">{b.enemyName}</h2>
      </div>

      <div className="relative aspect-[5/6] overflow-hidden rounded-2xl border-2 border-primary-100 bg-gradient-to-b from-red-50 via-white to-blue-50">
        <div className="absolute left-0 top-1/2 w-full border-t-2 border-dashed border-gray-300" />
        {units.map((u) => {
          const def = unitMap[u.key];
          return (
            <div key={u.id} style={cellStyle(u.r, u.c)}
              className={cn('absolute p-0.5 transition-all duration-300 ease-linear', !u.alive && 'scale-50 opacity-0')}>
              <div className="relative h-full w-full">
                <motion.div key={u.lunge?.n || 0} initial={{ x: '0%', y: '0%' }}
                  animate={u.lunge ? { x: ['0%', `${u.lunge.x}%`, '0%'], y: ['0%', `${u.lunge.y}%`, '0%'] } : undefined}
                  transition={{ duration: 0.22 / speed, ease: 'easeOut' }}
                  className={cn('relative flex h-full w-full items-center justify-center rounded-lg border-2 bg-white text-xl sm:text-2xl shadow-sm',
                    u.side === 'p' ? 'border-blue-500' : 'border-red-500')}>
                  <span>{def?.emoji}</span>
                  {u.star > 1 && <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-1 text-[9px] font-black leading-tight text-amber-500 shadow">{'★'.repeat(u.star)}</span>}
                </motion.div>
                {u.hit > 0 && <motion.div key={u.hit} aria-hidden className="pointer-events-none absolute inset-0 rounded-lg bg-white"
                  initial={{ opacity: 0.75 }} animate={{ opacity: 0 }} transition={{ duration: 0.25 }} />}
                <div className="absolute bottom-0.5 left-1 right-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div className={cn('h-full transition-all duration-200', u.side === 'p' ? 'bg-blue-500' : 'bg-red-500')} style={{ width: `${Math.max(0, (u.hp / u.maxHp) * 100)}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        {fx.map((f) => {
          if (f.kind === 'proj') {
            return (
              <motion.div key={f.id} aria-hidden className={cn('pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow', f.side === 'p' ? 'bg-blue-500' : 'bg-red-500')}
                initial={{ ...centerPct(f.from.r, f.from.c), opacity: 1 }} animate={{ ...centerPct(f.to.r, f.to.c), opacity: [1, 1, 0] }}
                transition={{ duration: f.dur, ease: 'linear' }} />
            );
          }
          if (f.kind === 'ring') {
            return (
              <motion.div key={f.id} aria-hidden style={{ ...cellStyle(f.r, f.c), pointerEvents: 'none' }} className={cn('absolute rounded-full border-4', f.cls)}
                initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 0.5 }} />
            );
          }
          return (
            <motion.div key={f.id} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -22 }} transition={{ duration: 0.8 }}
              style={{ ...cellStyle(f.r, f.c), pointerEvents: 'none' }}
              className={cn('absolute flex items-start justify-center text-sm font-black drop-shadow', f.cls)}>
              {f.text}
            </motion.div>
          );
        })}
      </div>

      {!done ? (
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 4].map((x) => (
            <button key={x} type="button" onClick={() => setSpeed(x)}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-bold', speed === x ? 'bg-primary text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100')}>{x}x</button>
          ))}
          <button type="button" onClick={skip} className={cn(btnGhost, 'px-3 py-1.5')}>Bỏ qua</button>
        </div>
      ) : (
        <motion.div initial={reduce ? false : { opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className={cn('space-y-2 rounded-2xl border-2 p-4 text-center', win ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50')}>
          <div className="text-2xl font-black">{win ? '🎉 Thắng trận!' : '💥 Thua trận'}</div>
          {!win && <div className="text-sm text-gray-600">Bạn mất 1 mạng.</div>}
          {battle.income && (
            <div className="text-sm text-gray-700">
              +{battle.income.total} vàng <span className="text-gray-400">(gốc {battle.income.base}{battle.income.interest ? `, lãi ${battle.income.interest}` : ''}{battle.income.streak ? `, chuỗi ${battle.income.streak}` : ''})</span>
            </div>
          )}
          {battle.finished && <div className="text-sm font-bold text-gray-700">{battle.state.status === 'won' ? 'Bạn đã vượt qua tất cả các vòng!' : 'Hết mạng — lượt chơi kết thúc.'}</div>}
          <button type="button" onClick={finishBattle} className={btnPrimary}>{battle.finished ? 'Xem kết quả' : 'Tiếp tục'}</button>
        </motion.div>
      )}
    </div>
  );
}
