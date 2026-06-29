import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import type { Pawn } from '../types';

export function MyPawns() {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .myPawns()
      .then((result) => setPawns(result.pawns))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawns'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">My Pawns</h1>
          <p className="mt-2 text-zinc-400">Track moderation status and update your submissions.</p>
        </div>
        <Link className="button-primary" to="/add-pawn">
          Add Pawn
        </Link>
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {pawns.length === 0 ? <p className="empty">You have not submitted any pawns yet.</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pawns.map((pawn) => (
          <PawnCard key={pawn.id} pawn={pawn} />
        ))}
      </section>
    </div>
  );
}
