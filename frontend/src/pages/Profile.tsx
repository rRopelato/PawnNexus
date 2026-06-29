import { useEffect, useState } from 'react';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import type { Pawn, User } from '../types';

export function Profile({ user }: { user: User | null }) {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    api
      .myPawns()
      .then((result) => setPawns(result.pawns))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawns'));
  }, [user]);

  if (!user) return <p className="empty">Login to view your profile.</p>;

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-white">Profile</h1>
          <p className="mt-2 text-zinc-400">Your account and created Pawns.</p>
        </div>
        <section className="rounded border border-white/10 bg-ash-900 p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Email" value={user.username} />
            <Info label="Username" value={user.username} />
            <Info label="Role" value={user.role} />
            <Info label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
          </dl>
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Created Pawns</h2>
          <p className="mt-1 text-sm text-zinc-400">All of your Pawns remain visible here, including inactive 1-star Pawns.</p>
        </div>
        {error ? <p className="alert">{error}</p> : null}
        {pawns.length === 0 ? <p className="empty">You have not submitted any pawns yet.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pawns.map((pawn) => (
            <PawnCard key={pawn.id} pawn={pawn} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-100">{value}</dd>
    </div>
  );
}
