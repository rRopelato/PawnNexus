import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import { inclinations, platforms, specializations, vocations } from '../lib/constants';
import type { Pawn, PawnFilters, Vocation } from '../types';

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
          <label className="space-y-2 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2">
              <Search size={16} className="text-ember-500" /> Search
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input
                className="pl-10"
                placeholder="Search by name"
                value={filters.search ?? ''}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <select value={filters.platform ?? ''} onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value }))}>
          <option value="">All platforms</option>
          {platforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
        <label className="relative block">
          <VocationIcon vocation={filters.vocation as Vocation | undefined} />
          <select className="pl-11" value={filters.vocation ?? ''} onChange={(event) => setFilters((current) => ({ ...current, vocation: event.target.value }))}>
            <option value="">All vocations</option>
            {vocations.map((vocation) => (
              <option key={vocation}>{vocation}</option>
            ))}
          </select>
        </label>
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

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <ComingSoonFilter label="Weapon skills" />
        <ComingSoonFilter label="Weapon" />
        <ComingSoonFilter label="Augments" />
        <ComingSoonFilter label="Armor" />
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Inclination</span>
          <select value={filters.inclination ?? ''} onChange={(event) => setFilters((current) => ({ ...current, inclination: event.target.value }))}>
            <option value="">All inclinations</option>
            {inclinations.map((inclination) => <option key={inclination}>{inclination}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Specialization</span>
          <select value={filters.specialization ?? ''} onChange={(event) => setFilters((current) => ({ ...current, specialization: event.target.value }))}>
            <option value="">All specializations</option>
            {specializations.map((specialization) => <option key={specialization}>{specialization}</option>)}
          </select>
        </label>
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

function VocationIcon({ vocation }: { vocation?: Vocation }) {
  const name = vocation ? vocation.toLowerCase() : 'fighter';
  const alt = vocation ? `${vocation} vocation icon` : 'Vocation icon';

  return <img className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 object-contain" src={`https://cdn.pawnnexus.com/${name}.png`} alt={alt} loading="lazy" />;
}

function ComingSoonFilter({ label }: { label: string }) {
  return (
    <label className="space-y-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input disabled className="opacity-70" placeholder="Coming soon" />
    </label>
  );
}
