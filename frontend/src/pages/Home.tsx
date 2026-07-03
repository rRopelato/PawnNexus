import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import { inclinations, platforms, specializations, vocations } from '../lib/constants';
import type { Pawn, PawnFilters, PawnSort, Vocation } from '../types';

const sortOptions: Array<{ value: PawnSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'recently-refreshed', label: 'Recently refreshed' },
  { value: 'random', label: 'Random' },
  { value: 'level-desc', label: 'Level high to low' },
  { value: 'level-asc', label: 'Level low to high' },
];

export function Home() {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [filters, setFilters] = useState<PawnFilters>(() => ({ page: 1, pageSize: getBrowsePageSize(), sort: 'newest' }));
  const [meta, setMeta] = useState({ page: 1, pageSize: getBrowsePageSize(), total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    function syncPageSize() {
      const nextPageSize = getBrowsePageSize();
      setFilters((current) => current.pageSize === nextPageSize ? current : { ...current, page: 1, pageSize: nextPageSize });
    }

    window.addEventListener('resize', syncPageSize);
    return () => window.removeEventListener('resize', syncPageSize);
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .pawns(filters)
      .then((result) => {
        setPawns(result.pawns);
        setMeta({ page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages });
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawns'))
      .finally(() => setLoading(false));
  }, [filters]);

  function updateFilters(next: Partial<PawnFilters>) {
    setFilters((current) => ({ ...current, ...next, page: 1 }));
  }

  function setPage(page: number) {
    setFilters((current) => ({ ...current, page }));
  }

  function clearFilters() {
    setFilters({ page: 1, pageSize: filters.pageSize, sort: 'newest' });
  }

  const showingFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const showingTo = Math.min(meta.page * meta.pageSize, meta.total);
  const resultText = loading
    ? 'Loading pawns...'
    : meta.total > 0
      ? 'Showing ' + showingFrom + '-' + showingTo + ' of ' + meta.total + ' pawns'
      : 'No pawns to show';

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
                onChange={(event) => updateFilters({ search: event.target.value })}
              />
            </div>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <select value={filters.platform ?? ''} onChange={(event) => updateFilters({ platform: event.target.value })}>
          <option value="">All platforms</option>
          {platforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
        <label className="relative block">
          <VocationIcon vocation={filters.vocation as Vocation | undefined} />
          <select className="pl-11" value={filters.vocation ?? ''} onChange={(event) => updateFilters({ vocation: event.target.value })}>
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
          onChange={(event) => updateFilters({ minLevel: event.target.value })}
        />
        <input
          type="number"
          min={1}
          placeholder="Max level"
          value={filters.maxLevel ?? ''}
          onChange={(event) => updateFilters({ maxLevel: event.target.value })}
        />
        <div className="h-full">
          <label className="sr-only" htmlFor="pawn-sort">Sort</label>
          <select id="pawn-sort" className="h-full" value={filters.sort ?? 'newest'} onChange={(event) => updateFilters({ sort: event.target.value as PawnSort })}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <ComingSoonFilter label="Weapon skills" />
        <ComingSoonFilter label="Weapon" />
        <ComingSoonFilter label="Augments" />
        <ComingSoonFilter label="Armor" />
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Inclination</span>
          <select value={filters.inclination ?? ''} onChange={(event) => updateFilters({ inclination: event.target.value })}>
            <option value="">All inclinations</option>
            {inclinations.map((inclination) => <option key={inclination}>{inclination}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Specialization</span>
          <select value={filters.specialization ?? ''} onChange={(event) => updateFilters({ specialization: event.target.value })}>
            <option value="">All specializations</option>
            {specializations.map((specialization) => <option key={specialization}>{specialization}</option>)}
          </select>
        </label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400">
        <p>{resultText}</p>
        <button className="button-secondary" type="button" onClick={clearFilters}>Clear filters</button>
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {!loading && pawns.length === 0 ? (
        <section className="empty space-y-3">
          <p className="text-white">No approved pawns match this search yet.</p>
          <p className="text-sm text-zinc-500">Try clearing filters, changing the sort, or checking back after new submissions are approved.</p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pawns.map((pawn) => (
          <PawnCard key={pawn.id} pawn={pawn} />
        ))}
      </section>

      {meta.totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pawn pages">
          <button className="button-secondary" type="button" onClick={() => setPage(Math.max(1, meta.page - 1))} disabled={meta.page <= 1}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="rounded border border-white/10 bg-ash-900 px-4 py-2 text-sm text-zinc-300">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button className="button-secondary" type="button" onClick={() => setPage(Math.min(meta.totalPages, meta.page + 1))} disabled={meta.page >= meta.totalPages}>
            Next <ChevronRight size={16} />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function getBrowsePageSize() {
  if (typeof window === 'undefined') return 12;
  return window.matchMedia('(max-width: 767px)').matches ? 8 : 12;
}

function VocationIcon({ vocation }: { vocation?: Vocation }) {
  const name = vocation ? vocation.toLowerCase() : 'fighter';
  const alt = vocation ? vocation + ' vocation icon' : 'Vocation icon';

  return <img className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 object-contain" src={'https://cdn.pawnnexus.com/' + name + '.png'} alt={alt} loading="lazy" />;
}

function ComingSoonFilter({ label }: { label: string }) {
  return (
    <label className="space-y-2 text-sm text-zinc-300">
      <span>{label}</span>
      <input disabled className="opacity-70" placeholder="Coming soon" />
    </label>
  );
}
