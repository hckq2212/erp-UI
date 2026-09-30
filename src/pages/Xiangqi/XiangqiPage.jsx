import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Swords, Bot, Loader2, Flag, Handshake, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useXiangqiStore, xiangqiApi } from '../../store/useXiangqiStore';
import { Board, pieceLabel } from './Board';
import {
  initialBoard, legalMoves, applyMove, isInCheck, outcomeAfterMove, insufficientMaterial, bestBotMove,
} from './rules';
import { StatusBanner, MaterialPanel } from './GamePanels';
import { deriveLobbyStatus, deriveOnlineStatus, derivePracticeStatus, reasonText } from './gameStatus';
import { analyzeMaterial } from './material';

const TCS = [{ v: 180, l: '3 phút' }, { v: 300, l: '5 phút' }, { v: 600, l: '10 phút' }];
const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const kingPos = (board, color) => {
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) if (board[r][c] === color + 'K') return [r, c];
  return null;
};
const btn = 'rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = cn(btn, 'bg-primary text-white hover:bg-primary-hover');
const btnGhost = cn(btn, 'border-2 border-primary text-primary-600 hover:bg-primary-50');

/** Chọn quân / hiện nước đi hợp lệ (chỉ để gợi ý UI; máy chủ mới là nơi quyết định). */
function useBoardInput(board, turn, myColor, enabled, onMove) {
  const [sel, setSel] = useState(null);
  const moves = useMemo(() => (enabled && turn === myColor ? legalMoves(board, myColor) : []), [board, turn, myColor, enabled]);
  useEffect(() => setSel(null), [board]);
  const targets = sel ? moves.filter((m) => m.fr === sel[0] && m.fc === sel[1]) : [];
  const onCell = (r, c) => {
    if (!enabled || turn !== myColor) return;
    const m = targets.find((t) => t.tr === r && t.tc === c);
    if (m) { setSel(null); onMove(m); return; }
    const p = board[r][c];
    setSel(p && p[0] === myColor && moves.some((x) => x.fr === r && x.fc === c) ? [r, c] : null);
  };
  return { sel, targets, onCell };
}

function PlayerBar({ name, rating, color, ms, active, online = true }) {
  return (
    <div className={cn('flex items-center justify-between rounded-2xl border px-4 py-2.5', active ? 'border-primary bg-primary-50' : 'border-primary-100 bg-white')}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn('h-4 w-4 rounded-full border-2 shrink-0', color === 'r' ? 'border-[#C2260C] bg-[#C2260C]' : 'border-[#3B2A20] bg-[#3B2A20]')} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{name}{!online && <span className="ml-2 text-xs font-medium text-red-500">mất kết nối…</span>}</p>
          {rating != null && <p className="text-xs text-gray-500">Rating {rating}</p>}
        </div>
      </div>
      {ms != null && <span className={cn('rounded-lg px-3 py-1 font-mono text-lg font-bold tabular-nums', active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600', ms < 30000 && 'ring-2 ring-red-400')}>{fmt(ms)}</span>}
    </div>
  );
}

function MoveList({ moves, vietnamese }) {
  const rows = useMemo(() => {
    let b = initialBoard();
    return moves.map((m) => { const p = b[m.fr][m.fc]; b = applyMove(b, m); return `${pieceLabel(p, vietnamese)} ${m.fc + 1}${10 - m.fr} → ${m.tc + 1}${10 - m.tr}`; });
  }, [moves, vietnamese]);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 1e6; }, [rows.length]);
  return (
    <ol ref={ref} className="max-h-32 overflow-auto rounded-xl bg-primary-50 p-3 pl-8 text-xs text-gray-600 list-decimal">
      {rows.length ? rows.map((t, i) => <li key={i}>{t}</li>) : <li className="list-none -ml-5 text-gray-400">Chưa có nước đi</li>}
    </ol>
  );
}

/* ---------------------------- Ghép trận online ---------------------------- */
function OnlinePanel({ vietnamese }) {
  const s = useXiangqiStore();
  const { game, queue, gameOver, accountId, connected, receivedAt, drawOfferedToMe, opponentOnline, opponentGraceEndsAt, error } = s;
  const [tc, setTc] = useState(600);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 250); return () => clearInterval(t); }, []);

  const myColor = game ? (game.red.accountId === accountId ? 'r' : 'b') : 'r';
  const playing = !!game && !game.over;
  const { sel, targets, onCell } = useBoardInput(game?.board || initialBoard(), game?.turn, myColor, playing, (m) => s.move(m));

  if (!game) {
    return (
      <div className="space-y-4">
        <StatusBanner status={deriveLobbyStatus({ connected, queue, error })} />
        <div className="rounded-2xl border border-primary-100 bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900"><Swords className="h-5 w-5 text-primary" /> Ghép trận với đồng nghiệp</h3>
          {queue.queued ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-primary-700"><Loader2 className="h-5 w-5 animate-spin" /> Đang tìm đối thủ… {Math.floor((queue.waitedMs || 0) / 1000)}s</div>
              <button className={btnGhost} onClick={() => s.leaveQueue()}>Hủy tìm trận</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {TCS.map((t) => (
                  <button key={t.v} onClick={() => setTc(t.v)} className={cn(btn, 'flex-1 border-2', tc === t.v ? 'border-primary bg-primary text-white' : 'border-primary-200 text-primary-700 hover:bg-primary-50')}>{t.l}</button>
                ))}
              </div>
              <button className={cn(btnPrimary, 'w-full py-3')} disabled={!connected} onClick={() => s.joinQueue(tc)}>Tìm đối thủ</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const flip = myColor === 'b';
  const opp = myColor === 'r' ? game.black : game.red;
  const me = myColor === 'r' ? game.red : game.black;
  const running = !game.over && game.moves.length >= 2;
  const clockOf = (side) => (game.clocks[side] - (running && game.turn === side ? Date.now() - receivedAt : 0));
  const inCheckKing = game.inCheck ? kingPos(game.board, game.turn) : null;
  const last = game.moves[game.moves.length - 1];
  const status = deriveOnlineStatus({
    connected, game, gameOver, myColor, opponentOnline, drawOfferedToMe,
    opponentGraceLeftMs: opponentGraceEndsAt ? opponentGraceEndsAt - Date.now() : null,
    myMs: running && game.turn === myColor ? clockOf(myColor) : null,
  });
  const my = gameOver && gameOver.ratings?.[myColor === 'r' ? 'red' : 'black'];
  const won = gameOver && ((gameOver.result === 'red' && myColor === 'r') || (gameOver.result === 'black' && myColor === 'b'));
  const finalMat = gameOver ? analyzeMaterial(game.board) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,560px)_minmax(260px,1fr)]">
      <div className="space-y-3">
        <PlayerBar name={opp.name} rating={opp.rating} color={myColor === 'r' ? 'b' : 'r'} ms={clockOf(myColor === 'r' ? 'b' : 'r')} active={playing && game.turn !== myColor} online={opponentOnline} />
        <Board board={game.board} flip={flip} last={last} ply={game.moves.length} selected={sel} targets={targets} checkedKing={inCheckKing} vietnamese={vietnamese} disabled={!playing || game.turn !== myColor} onCell={onCell} />
        <PlayerBar name={me.name + ' (bạn)'} rating={me.rating} color={myColor} ms={clockOf(myColor)} active={playing && game.turn === myColor} />
      </div>
      <div className="space-y-3">
        <StatusBanner status={status} />
        {error && <p className="text-sm text-red-600" onClick={s.clearError}>{error}</p>}
        <MoveList moves={game.moves} vietnamese={vietnamese} />
        {playing && (
          <div className="space-y-2">
            {drawOfferedToMe && (
              <div className="flex items-center justify-between rounded-xl border border-primary bg-primary-50 p-3 text-sm">
                <span>Đối thủ xin hòa</span>
                <span className="flex gap-2">
                  <button className={btnPrimary} onClick={() => s.respondDraw(true)}>Chấp nhận</button>
                  <button className={btnGhost} onClick={() => s.respondDraw(false)}>Từ chối</button>
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <button className={cn(btnGhost, 'flex-1')} onClick={() => s.offerDraw()} disabled={game.moves.length < 2 || !!game.drawOffer}><Handshake className="mr-1 inline h-4 w-4" />{game.drawOffer === myColor ? 'Đã xin hòa' : 'Xin hòa'}</button>
              <button className={cn(btn, 'flex-1 border-2 border-red-300 text-red-600 hover:bg-red-50')} onClick={() => window.confirm('Bạn chắc chắn muốn xin thua?') && s.resign()}><Flag className="mr-1 inline h-4 w-4" />Xin thua</button>
            </div>
          </div>
        )}
        <MaterialPanel board={game.board} moves={game.moves} myColor={myColor} meLabel="Bạn" oppLabel="Đối thủ" vietnamese={vietnamese} />
      </div>

      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="xq-enter w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className={cn('mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full', won ? 'bg-primary text-white' : 'bg-primary-100 text-primary-700')}><Trophy className="h-7 w-7" /></div>
            <h3 className="text-xl font-black text-gray-900">
              {gameOver.result === 'draw' ? 'Ván hòa' : gameOver.result === 'aborted' ? 'Ván đã hủy' : won ? 'Bạn thắng!' : 'Bạn thua'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Lý do: {reasonText(gameOver.reason, ['draw', 'aborted'].includes(gameOver.result) ? null : won)}</p>
            {finalMat && (
              <p className="mt-2 text-xs text-gray-500">Lực lượng còn lại: Bạn {finalMat[myColor].score} · Đối thủ {finalMat[myColor === 'r' ? 'b' : 'r'].score}</p>
            )}
            {my && gameOver.result !== 'aborted' && (
              <p className="mt-3 text-sm font-semibold text-primary-700">Rating {my.before} → {my.after} ({my.after - my.before >= 0 ? '+' : ''}{my.after - my.before})</p>
            )}
            {gameOver.result === 'aborted' && <p className="mt-3 text-xs text-gray-500">Ván quá ngắn nên không tính rating.</p>}
            <button className={cn(btnPrimary, 'mt-5 w-full py-3')} onClick={s.leaveFinishedGame}>Chơi ván mới</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Luyện tập ------------------------------ */
function PracticePanel({ vietnamese }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('r');
  const [hist, setHist] = useState([]);
  const [moves, setMoves] = useState([]);
  const [lvl, setLvl] = useState(2);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(null); // {result, reason} | null

  const commit = (b, m, next, h) => {
    setBoard(b); setTurn(next); setHist(h); setMoves((x) => [...x, m]);
    const out = outcomeAfterMove(b, next) || (insufficientMaterial(b) ? { result: 'draw', reason: 'insufficient_material' } : null);
    if (out) setOver(out);
    return !out;
  };
  const play = (m) => {
    const nb = applyMove(board, m);
    const h = [...hist, { board, turn, n: moves.length }];
    if (commit(nb, m, 'b', h)) {
      setBusy(true);
      setTimeout(() => {
        const bm = bestBotMove(nb, 'b', lvl);
        setBusy(false);
        if (bm) commit(applyMove(nb, bm), bm, 'r', [...h, { board: nb, turn: 'b', n: h.length }]);
      }, 60);
    }
  };
  const { sel, targets, onCell } = useBoardInput(board, turn, 'r', !over && !busy, play);
  const reset = () => { setBoard(initialBoard()); setTurn('r'); setHist([]); setMoves([]); setOver(null); };
  const undo = () => {
    if (busy || !hist.length) return;
    const h = [...hist]; let last = h.pop();
    if (last.turn === 'b' && h.length) last = h.pop();
    setBoard(last.board); setTurn(last.turn); setHist(h); setMoves((x) => x.slice(0, last.n)); setOver(null);
  };
  const inChk = !over && isInCheck(board, turn);
  const chk = inChk ? kingPos(board, turn) : null;
  const status = derivePracticeStatus({ over, busy, turn, inCheck: inChk });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,560px)_minmax(260px,1fr)]">
      <Board board={board} last={moves[moves.length - 1]} ply={moves.length} selected={sel} targets={targets} checkedKing={chk} vietnamese={vietnamese} disabled={!!over || busy} onCell={onCell} />
      <div className="space-y-3">
        <StatusBanner status={status} />
        <select value={lvl} onChange={(e) => setLvl(+e.target.value)} className="w-full rounded-xl border-2 border-primary-200 bg-white px-3 py-2 text-sm font-semibold">
          <option value={1}>Máy: dễ</option><option value={2}>Máy: vừa</option><option value={3}>Máy: khó</option>
        </select>
        <MoveList moves={moves} vietnamese={vietnamese} />
        <div className="flex gap-2"><button className={cn(btnPrimary, 'flex-1')} onClick={reset}>Ván mới</button><button className={cn(btnGhost, 'flex-1')} onClick={undo}><RotateCcw className="mr-1 inline h-4 w-4" />Đi lại</button></div>
        <MaterialPanel board={board} moves={moves} myColor="r" meLabel="Bạn" oppLabel="Máy" vietnamese={vietnamese} />
      </div>
    </div>
  );
}

/* ---------------------------- Bảng xếp hạng ---------------------------- */
function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState(null);
  const connected = useXiangqiStore((s) => s.connected);
  useEffect(() => {
    xiangqiApi.get('/xiangqi/leaderboard').then((r) => setRows(r.data)).catch(() => setRows([]));
    xiangqiApi.get('/xiangqi/me').then((r) => setMe(r.data)).catch(() => {});
  }, [connected]);
  return (
    <div className="space-y-4">
      {me && (
        <div className="grid grid-cols-4 gap-3 text-center">
          {[['Rating', me.rating], ['Số ván', me.gamesPlayed], ['Thắng', me.wins], ['Thua', me.losses]].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-primary-100 bg-white p-3"><p className="text-2xl font-black text-primary-600">{v}</p><p className="text-xs text-gray-500">{l}</p></div>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white">
        {rows === null ? <p className="p-5 text-sm text-gray-400">Đang tải…</p>
          : !rows.length ? <p className="p-5 text-sm text-gray-400">Chưa có ván xếp hạng nào. Hãy là người đầu tiên!</p>
            : rows.map((r, i) => (
              <div key={r.accountId} className="flex items-center justify-between border-b border-primary-50 px-4 py-2.5 last:border-0">
                <span className="flex items-center gap-3 text-sm font-semibold"><span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs', i < 3 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500')}>{i + 1}</span>{r.username}</span>
                <span className="font-mono font-bold text-primary-600">{r.rating}</span>
              </div>
            ))}
      </div>
    </div>
  );
}

/* --------------------------------- Trang --------------------------------- */
export function XiangqiPage() {
  const connect = useXiangqiStore((s) => s.connect);
  const connected = useXiangqiStore((s) => s.connected);
  const inGame = useXiangqiStore((s) => !!s.game && !s.game.over);
  const [tab, setTab] = useState('online');
  const [vietnamese, setVietnamese] = useState(false);

  useEffect(() => {
    connect(); // giữ socket khi chuyển trang để không bị xử thua vì rớt mạng
    return () => { const s = useXiangqiStore.getState(); if (s.queue.queued) s.leaveQueue(); };
  }, [connect]);
  useEffect(() => { if (inGame) setTab('online'); }, [inGame]);

  const tabs = [['online', 'Ghép trận', Swords], ['practice', 'Luyện tập', Bot], ['rank', 'Xếp hạng', Trophy]];
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Cờ tướng</h1>
          <p className="text-sm text-gray-500">Giải lao cùng đồng nghiệp: ghép trận theo rating, đồng hồ do máy chủ tính.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('flex items-center gap-1 text-xs font-semibold', connected ? 'text-green-600' : 'text-red-500')}>{connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}{connected ? 'Đã kết nối' : 'Mất kết nối'}</span>
          <button className={btnGhost} onClick={() => setVietnamese((v) => !v)}>{vietnamese ? 'Chữ Hán' : 'Tiếng Việt'}</button>
        </div>
      </div>
      <div className="flex gap-1 border-b-2 border-primary-100">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} disabled={inGame && id !== 'online'} onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40', tab === id ? 'bg-primary text-white' : 'text-gray-500 hover:bg-primary-50')}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>
      {tab === 'online' && <OnlinePanel vietnamese={vietnamese} />}
      {tab === 'practice' && <PracticePanel vietnamese={vietnamese} />}
      {tab === 'rank' && <Leaderboard />}
    </div>
  );
}
