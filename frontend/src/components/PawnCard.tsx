import { Link } from 'react-router';
import { BadgeCheck, Gamepad2, Star } from 'lucide-react';
import type { Pawn } from '../types';

export function PawnCard({ pawn }: { pawn: Pawn }) {
  return (
    <Link
      to={`/pawns/${pawn.id}`}
      className="group overflow-hidden rounded border border-white/10 bg-ash-900 transition hover:border-ember-500/50 hover:shadow-glow"
    >
      <div className="aspect-[4/3] overflow-hidden bg-ash-850">
        {pawn.thumbnailUrl ? (
          <img
            src={pawn.thumbnailUrl}
            alt={pawn.pawnName}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-zinc-500">
            <Gamepad2 size={42} />
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{pawn.pawnName}</h2>
            <p className="text-sm text-zinc-400">Arisen: {pawn.arisenName}</p>
          </div>
          {pawn.status === 'approved' ? <BadgeCheck className="shrink-0 text-ember-500" size={20} /> : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag">Lv. {pawn.level}</span>
          <span className="tag">{pawn.gender}</span>
          <span className="tag">{pawn.race}</span>
          <span className="tag">{pawn.vocation}</span>
          <span className="tag">{pawn.platform}</span>
          <span className="tag gap-1" title="Activity stars">
            <Star size={12} className="text-ember-500" /> {pawn.activityStars}/3
          </span>
        </div>
      </div>
    </Link>
  );
}
