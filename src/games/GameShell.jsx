import { Suspense } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { getGame } from './registry';

/** Khung chung cho mọi game tại /games/:gameId: thanh quay về hub + tải màn hình game theo yêu cầu. */
export function GameRoute() {
  const { gameId } = useParams();
  const game = getGame(gameId);
  if (!game) return <Navigate to="/games" replace />;
  const Game = game.Component;
  return (
    <div>
      <nav aria-label="Điều hướng game" className="mx-auto flex max-w-5xl items-center gap-1 px-4 pt-4 text-sm md:px-6 md:pt-6">
        <Link to="/games" className="inline-flex items-center gap-0.5 font-semibold text-gray-500 hover:text-primary-700">
          <ChevronLeft className="h-4 w-4" /> Game Hub
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-gray-800">{game.name}</span>
      </nav>
      <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-primary"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <Game key={game.id} />
      </Suspense>
    </div>
  );
}
