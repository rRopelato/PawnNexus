import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import { platforms, vocations } from '../lib/constants';
import type { Pawn, PawnFilters } from '../types';

export function Home() {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [filters, setFilters] = useState<PawnFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .pawns(filters)
      .then((result) => {
        setPawns(result.pawns);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawns'))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-ember-500">Dragon's Dogma 2</p>
          <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-6xl">Find the right Pawn for the road ahead.</h1>
          <p className="max-w-2xl text-zinc-400">
            Browse community Pawns by platform, vocation, level, and name. New submissions are reviewed before they appear publicly.
          </p>
        </div>

        <div className="rounded border border-white/10 bg-ash-900 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
            <input
              className="pl-10"
              placeholder="Search by name"
              value={filters.search ?? ''}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <select value={filters.platform ?? ''} onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value }))}>
          <option value="">All platforms</option>
          {platforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
        <select value={filters.vocation ?? ''} onChange={(event) => setFilters((current) => ({ ...current, vocation: event.target.value }))}>
          <option value="">All vocations</option>
          {vocations.map((vocation) => (
            <option key={vocation}>{vocation}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          placeholder="Min level"
          value={filters.minLevel ?? ''}
          onChange={(event) => setFilters((current) => ({ ...current, minLevel: event.target.value }))}
        />
        <input
          type="number"
          min={1}
          placeholder="Max level"
          value={filters.maxLevel ?? ''}
          onChange={(event) => setFilters((current) => ({ ...current, maxLevel: event.target.value }))}
        />
      </section>

      {error ? <p className="alert">{error}</p> : null}
      {loading ? <p className="text-zinc-400">Loading pawns...</p> : null}
      {!loading && pawns.length === 0 ? <p className="empty">No approved pawns match this search yet.</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pawns.map((pawn) => (
          <PawnCard key={pawn.id} pawn={pawn} />
        ))}
      </section>
    </div>
  );
}
