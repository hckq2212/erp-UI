import { Link } from 'react-router-dom';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { GAMES } from './registry';

const noPresence = () => null; // hằng số ổn định để thứ tự hook trong thẻ luôn cố định

function GameCard({ game }) {
  const presence = (game.usePresence || noPresence)();
  return (
    <Link to={`/games/${game.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-primary-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-2 focus-visible:outline-primary">
      <div className="flex h-36 items-center justify-center" style={{ background: `linear-gradient(135deg, ${game.accent[0]}, ${game.accent[1]})` }}>
        <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white text-4xl font-bold shadow-lg transition group-hover:scale-105"
          style={{ color: game.accent[1], fontFamily: "'Noto Serif SC','Songti SC',serif" }}>{game.emblem}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-black text-gray-900">{game.name}</h2>
          {presence && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
              <span className="xq-dot h-2 w-2 rounded-full bg-green-500" />{presence.text}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{game.tagline}</p>
        <div className="flex flex-wrap gap-1.5">
          {game.tags.map((t) => <span key={t} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">{t}</span>)}
        </div>
        <span className={cn('mt-auto flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition',
          presence?.live ? 'bg-primary text-white group-hover:bg-primary-hover' : 'border-2 border-primary text-primary-600 group-hover:bg-primary-50')}>
          {presence?.live ? 'Vào tiếp' : 'Chơi ngay'} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function GameHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900"><Gamepad2 className="h-7 w-7 text-primary" /> Game Hub</h1>
        <p className="text-sm text-gray-500">Giải lao cùng đồng nghiệp: chọn một game rồi bấm vào để chơi.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => <GameCard key={g.id} game={g} />)}
        <div className="flex min-h-48 items-center justify-center rounded-3xl border-2 border-dashed border-primary-200 p-5 text-center text-sm font-semibold text-primary-300">
          Sắp có thêm game…
        </div>
      </div>
    </div>
  );
}
