import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import type { Pawn } from '../types';

export function MyFavorites() {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .myFavorites()
      .then((result) => {
        setPawns(result.pawns);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load favorites'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">My Favorites</h1>
          <p className="mt-2 text-zinc-400">Saved Pawns you want to find again later.</p>
        </div>
        <Link className="button-secondary" to="/">
          Browse Pawns
        </Link>
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {loading ? <p className="text-zinc-400">Loading favorites...</p> : null}
      {!loading && pawns.length === 0 ? <p className="empty">You have not favorited any pawns yet.</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pawns.map((pawn) => (
          <PawnCard key={pawn.id} pawn={pawn} />
        ))}
      </section>
    </div>
  );
}
