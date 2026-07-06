import { Link } from 'react-router';
import { BadgeCheck, Clock, Gamepad2, Heart, Star, UserRound } from 'lucide-react';
import type { Pawn } from '../types';

export function PawnCard({ pawn }: { pawn: Pawn }) {
  const ownerSearchUrl = '/?search=' + encodeURIComponent(pawn.ownerUsername);

  return (
    <article className="group relative cursor-pointer overflow-hidden rounded border border-white/10 bg-ash-900 transition duration-200 hover:-translate-y-0.5 hover:border-ember-500/50 hover:shadow-glow">
      <Link to={`/pawns/${pawn.id}`} className="absolute inset-0 z-10" aria-label={`Open ${pawn.pawnName}'s pawn details`} />

      <div className="pointer-events-none relative aspect-[4/3] overflow-hidden bg-ash-850">
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

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded border border-black/30 bg-ash-950/85 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          <VocationIcon vocation={pawn.vocation} />
          {pawn.vocation}
        </div>

        <div className="absolute right-3 top-3 flex gap-2">
          {pawn.status === 'approved' ? (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-100">
              <BadgeCheck size={13} /> Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border border-ember-500/30 bg-ember-500/15 px-2 py-1 text-xs font-medium text-ember-100">
              <Clock size={13} /> {pawn.status}
            </span>
          )}
        </div>
      </div>

      <div className="pointer-events-none relative z-0 space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white transition group-hover:text-ember-500">{pawn.pawnName}</h2>
              <p className="truncate text-sm text-zinc-400">Arisen: {pawn.arisenName}</p>
            </div>
            <span className="shrink-0 rounded border border-ember-500/30 bg-ember-500/10 px-2 py-1 text-sm font-semibold text-ember-500">
              Lv. {pawn.level}
            </span>
          </div>

          <Link
            to={ownerSearchUrl}
            className="pointer-events-auto relative z-20 inline-flex max-w-full items-center gap-1.5 text-sm text-zinc-400 transition hover:text-ember-500"
            onClick={(event) => event.stopPropagation()}
          >
            <UserRound size={14} />
            <span className="truncate">{pawn.ownerUsername}</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag">{pawn.platform}</span>
          <span className="tag">{pawn.gender}</span>
          <span className="tag">{pawn.race}</span>
          {pawn.specialization ? <span className="tag">{pawn.specialization}</span> : null}
          <span className="tag gap-1" title="Likes">
            <Heart size={12} className={pawn.userLiked ? 'fill-ember-500 text-ember-500' : 'text-ember-500'} /> {pawn.likesCount}
          </span>
          <span className="tag gap-1" title="Activity stars">
            <Star size={12} className="text-ember-500" /> {pawn.activityStars}/3
          </span>
        </div>
      </div>
    </article>
  );
}

function VocationIcon({ vocation }: { vocation: string }) {
  const name = vocation.toLowerCase();
  return (
    <img
      className="h-5 w-5 object-contain"
      src={`https://cdn.pawnnexus.com/${name}.png`}
      alt={`${vocation} vocation icon`}
      loading="lazy"
    />
  );
}
