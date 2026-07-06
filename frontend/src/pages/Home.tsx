import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import { EmptyState } from '../components/Status';
import { inclinations, platforms, specializations, vocations } from '../lib/constants';
import type { Pawn, PawnFilters, PawnSort, Vocation } from '../types';

const sortOptions: Array<{ value: PawnSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'recently-refreshed', label: 'Recently refreshed' },
  { value: 'trending-week', label: 'Trending this week' },
  { value: 'random', label: 'Random' },
  { value: 'level-desc', label: 'Level high to low' },
  { value: 'level-asc', label: 'Level low to high' },
];

export function Home() {
  const [searchParams] = useSearchParams();
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [filters, setFilters] = useState<PawnFilters>(() => getInitialBrowseFilters(searchParams));
  const [meta, setMeta] = useState({ page: 1, pageSize: getBrowsePageSize(), total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const search = searchParams.get('search') ?? '';
    setFilters((current) => (current.search ?? '') === search ? current : { ...current, search, page: 1 });
  }, [searchParams]);

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
      <section className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-ember-500">Dragon's Dogma 2</p>
        <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-6xl">Find the right Pawn for the road ahead.</h1>
        <p className="max-w-2xl text-zinc-400">
          Browse community Pawns by platform, vocation, level, and name. New submissions are reviewed before they appear publicly.
        </p>
      </section>

      <section className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <label className="space-y-2 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2 font-medium text-zinc-200">
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

          <label className="space-y-2 text-sm text-zinc-300">
            <span className="inline-flex items-center gap-2 font-medium text-zinc-200">
              <ArrowUpDown size={16} className="text-ember-500" /> Sort
            </span>
            <select value={filters.sort ?? 'newest'} onChange={(event) => updateFilters({ sort: event.target.value as PawnSort })}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            <Filter size={15} className="text-ember-500" /> Basic filters
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
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
          </div>
        </div>

        <div className="rounded border border-white/10 bg-ash-950/40">
          <button
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-200"
            type="button"
            aria-expanded={showAdvancedFilters}
            aria-controls="advanced-filters"
            onClick={() => setShowAdvancedFilters((current) => !current)}
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-ember-500" /> Advanced filters
            </span>
            <ChevronDown
              size={18}
              className={'shrink-0 text-zinc-500 transition ' + (showAdvancedFilters ? 'rotate-180 text-ember-500' : '')}
              aria-hidden="true"
            />
          </button>

          {showAdvancedFilters ? (
            <div id="advanced-filters" className="grid gap-4 border-t border-white/10 p-4 md:grid-cols-3 xl:grid-cols-6">
              <ComingSoonFilter label="Weapon" />
              <ComingSoonFilter label="Armor" />
              <ComingSoonFilter label="Skills" />
              <ComingSoonFilter label="Augments" />
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
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400">
        <p>{resultText}</p>
        <button className="button-secondary" type="button" onClick={clearFilters}>Clear filters</button>
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {!loading && pawns.length === 0 ? (
        <EmptyState title="No approved pawns match this search yet.">
          Try clearing filters, changing the sort, or checking back after new submissions are approved.
        </EmptyState>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && pawns.length === 0 ? Array.from({ length: meta.pageSize }).map((_, index) => <PawnCardSkeleton key={index} />) : null}
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

function getInitialBrowseFilters(searchParams: URLSearchParams): PawnFilters {
  return {
    page: 1,
    pageSize: getBrowsePageSize(),
    sort: 'newest',
    search: searchParams.get('search') ?? undefined,
  };
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


function PawnCardSkeleton() {
  return (
    <div className="overflow-hidden rounded border border-white/10 bg-ash-900">
      <div className="aspect-[4/3] bg-white/5" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 rounded bg-white/5" />
        <div className="h-4 w-1/2 rounded bg-white/5" />
        <div className="flex gap-2 pt-2">
          <span className="h-7 w-16 rounded bg-white/5" />
          <span className="h-7 w-20 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}
