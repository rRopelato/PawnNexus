import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { BadgeCheck, Bookmark, Clock, EyeOff, Heart, Plus, ScrollText } from 'lucide-react';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import { EmptyState, LoadingBlock } from '../components/Status';
import type { Pawn } from '../types';

export function MyPawns() {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .myPawns()
      .then((result) => setPawns(result.pawns))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawns'))
      .finally(() => setLoading(false));
  }, []);

  const summary = pawns.reduce(
    (totals, pawn) => ({
      total: totals.total + 1,
      pending: totals.pending + (pawn.status === 'pending' ? 1 : 0),
      approved: totals.approved + (pawn.status === 'approved' ? 1 : 0),
      inactive: totals.inactive + (pawn.activityStars <= 1 ? 1 : 0),
      likes: totals.likes + pawn.likesCount,
      favorites: totals.favorites + pawn.favoritesCount,
    }),
    { total: 0, pending: 0, approved: 0, inactive: 0, likes: 0, favorites: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">My Pawns</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Track moderation status, activity, and community response for every Pawn you have submitted.
          </p>
        </div>
        <Link className="button-primary shrink-0 px-5 py-3 text-base" to="/add-pawn">
          <Plus size={18} />
          Add Pawn
        </Link>
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {loading ? <LoadingBlock label="Loading your Pawns..." rows={4} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={<ScrollText size={18} />} label="Total pawns" value={summary.total} />
        <SummaryCard icon={<Clock size={18} />} label="Pending" value={summary.pending} />
        <SummaryCard icon={<BadgeCheck size={18} />} label="Approved" value={summary.approved} />
        <SummaryCard icon={<EyeOff size={18} />} label="Inactive" value={summary.inactive} />
        <SummaryCard icon={<Heart size={18} />} label="Likes received" value={summary.likes} />
        <SummaryCard icon={<Bookmark size={18} />} label="Favorites received" value={summary.favorites} />
      </section>

      {!loading && pawns.length === 0 ? (
        <EmptyState title="You have not submitted any pawns yet.">
          <Link className="button-primary mt-2" to="/add-pawn">
            <Plus size={16} />
            Add your first Pawn
          </Link>
        </EmptyState>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pawns.map((pawn) => (
          <PawnCard key={pawn.id} pawn={pawn} />
        ))}
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article className="rounded border border-white/10 bg-ash-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-grid h-9 w-9 place-items-center rounded border border-ember-500/25 bg-ember-500/10 text-ember-500">
          {icon}
        </span>
        <strong className="text-2xl font-semibold text-white">{value}</strong>
      </div>
      <p className="mt-3 text-sm text-zinc-400">{label}</p>
    </article>
  );
}
