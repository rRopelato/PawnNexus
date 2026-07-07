import { ArrowUpDown, BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Filter, Heart, LayoutGrid, List, Search, SlidersHorizontal, Star, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import { EmptyState } from '../components/Status';
import { inclinations, platforms, specializations, vocations } from '../lib/constants';
import type { Pawn, PawnFilters, PawnSort, Vocation } from '../types';

type BrowseView = 'grid' | 'list';

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
  const [viewMode, setViewMode] = useState<BrowseView>('grid');

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

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
        <p>{resultText}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-white/10 bg-ash-900 p-1" aria-label="Browse view mode">
            <button
              className={viewMode === 'grid' ? 'rounded bg-ember-500 px-3 py-2 text-ash-950' : 'rounded px-3 py-2 text-zinc-300 transition hover:text-white'}
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={viewMode === 'list' ? 'rounded bg-ember-500 px-3 py-2 text-ash-950' : 'rounded px-3 py-2 text-zinc-300 transition hover:text-white'}
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
          <button className="button-secondary" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {!loading && pawns.length === 0 ? (
        <EmptyState title="No approved pawns match this search yet.">
          Try clearing filters, changing the sort, or checking back after new submissions are approved.
        </EmptyState>
      ) : null}

      {viewMode === 'grid' ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading && pawns.length === 0 ? Array.from({ length: meta.pageSize }).map((_, index) => <PawnCardSkeleton key={index} />) : null}
          {pawns.map((pawn) => (
            <PawnCard key={pawn.id} pawn={pawn} />
          ))}
        </section>
      ) : (
        <PawnListView pawns={pawns} loading={loading && pawns.length === 0} rows={meta.pageSize} />
      )}

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


function PawnListView({ pawns, loading, rows }: { pawns: Pawn[]; loading: boolean; rows: number }) {
  return (
    <section className="overflow-hidden rounded border border-white/10 bg-ash-900">
      <div className="hidden border-b border-white/10 bg-ash-950/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 lg:grid lg:grid-cols-[minmax(0,1.35fr)_120px_80px_minmax(0,1fr)_90px_80px_88px] lg:gap-3">
        <span>Pawn</span>
        <span>Vocation</span>
        <span>Level</span>
        <span>Inclination</span>
        <span>Gender</span>
        <span>Activity</span>
        <span className="text-right">Detail</span>
      </div>

      <div className="divide-y divide-white/10">
        {loading ? Array.from({ length: rows }).map((_, index) => <PawnListSkeleton key={index} />) : null}
        {pawns.map((pawn) => <PawnListRow key={pawn.id} pawn={pawn} />)}
      </div>
    </section>
  );
}

function PawnListRow({ pawn }: { pawn: Pawn }) {
  const ownerProfileUrl = '/users/' + encodeURIComponent(pawn.ownerUsername);
  const detailsUrl = '/pawns/' + pawn.id;
  const tags = [pawn.platform, pawn.race, pawn.specialization].filter(Boolean).join(' / ');

  return (
    <article className="group relative bg-ash-900 transition hover:bg-white/[0.035]">
      <Link to={detailsUrl} className="absolute inset-0 z-10" aria-label={'Open ' + pawn.pawnName + ' details'} />
      <div className="grid gap-2 px-3 py-2.5 lg:grid-cols-[minmax(0,1.35fr)_120px_80px_minmax(0,1fr)_90px_80px_88px] lg:items-center lg:gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Link to={detailsUrl} className="relative z-20 truncate font-semibold text-white hover:text-ember-500" onClick={(event) => event.stopPropagation()}>
              {pawn.pawnName}
            </Link>
            {pawn.status === 'approved' ? <span className="hidden rounded border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] text-emerald-100 sm:inline">Approved</span> : null}
          </div>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span className="truncate">Arisen: {pawn.arisenName}</span>
            <Link to={ownerProfileUrl} className="relative z-20 inline-flex min-w-0 items-center gap-1 hover:text-ember-500" onClick={(event) => event.stopPropagation()}>
              <UserRound size={12} /> <span className="truncate">{pawn.ownerUsername}</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-200">
          <ListVocationIcon vocation={pawn.vocation} />
          <span>{pawn.vocation}</span>
        </div>

        <div className="text-sm font-semibold text-ember-500">Lv. {pawn.level}</div>

        <div className="min-w-0 text-sm">
          <p className="truncate text-zinc-300">{pawn.inclination}</p>
          <p className="truncate text-xs text-zinc-600">{tags}</p>
        </div>

        <div className="text-sm text-zinc-300">{pawn.gender}</div>

        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <span className="inline-flex items-center gap-1" title="Activity"><Star size={12} className="text-ember-500" /> {pawn.activityStars}/3</span>
          <span className="inline-flex items-center gap-1 lg:hidden" title="Likes"><Heart size={12} className={pawn.userLiked ? 'fill-ember-500 text-ember-500' : 'text-ember-500'} /> {pawn.likesCount}</span>
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <span className="hidden items-center gap-1 text-xs text-zinc-400 lg:inline-flex" title="Likes"><Heart size={12} className={pawn.userLiked ? 'fill-ember-500 text-ember-500' : 'text-ember-500'} /> {pawn.likesCount}</span>
          <Link to={detailsUrl} className="button-secondary relative z-20 px-2.5 py-1 text-xs" onClick={(event) => event.stopPropagation()}>Detail</Link>
        </div>
      </div>
    </article>
  );
}

function ListVocationIcon({ vocation }: { vocation: Vocation }) {
  return <img className="h-5 w-5 shrink-0 object-contain" src={'https://cdn.pawnnexus.com/' + vocation.toLowerCase() + '.png'} alt={vocation + ' vocation icon'} loading="lazy" />;
}

function PawnListSkeleton() {
  return (
    <div className="px-3 py-2.5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_120px_80px_minmax(0,1fr)_90px_80px_88px] lg:items-center">
        <div className="space-y-1.5"><div className="h-4 w-40 rounded bg-white/5" /><div className="h-3 w-56 rounded bg-white/5" /></div>
        <div className="h-5 w-24 rounded bg-white/5" />
        <div className="h-5 w-14 rounded bg-white/5" />
        <div className="h-5 rounded bg-white/5" />
        <div className="h-5 w-16 rounded bg-white/5" />
        <div className="h-5 w-12 rounded bg-white/5" />
        <div className="h-7 w-16 rounded bg-white/5 lg:ml-auto" />
      </div>
    </div>
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
