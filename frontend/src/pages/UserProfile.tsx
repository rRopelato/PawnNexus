import { Calendar, Heart, Shield, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { PawnCard } from '../components/PawnCard';
import { api } from '../lib/api';
import { formatDate, relativeDate } from '../lib/dates';
import { EmptyState, LoadingBlock } from '../components/Status';
import type { Pawn, PublicUserProfile } from '../types';

export function UserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    api
      .userProfile(username)
      .then((result) => {
        setProfile(result.profile);
        setPawns(result.pawns);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load user profile'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <LoadingBlock label="Loading profile..." rows={4} />;
  if (error) return <p className="alert">{error}</p>;
  if (!profile) return <EmptyState title="User not found." />;

  return (
    <div className="space-y-8">
      <section className="space-y-6 border-b border-white/10 pb-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-ember-500">User profile</p>
          <h1 className="text-4xl font-semibold text-white md:text-6xl">{profile.username}</h1>
          <p className="text-zinc-400">Community member since {formatDate(profile.createdAt)}.</p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Shield size={16} />} label="Role" value={profile.role} />
          <Stat icon={<Calendar size={16} />} label="Joined" value={relativeDate(profile.createdAt)} />
          <Stat icon={<Heart size={16} />} label="Likes received" value={String(profile.totalLikes)} />
          <Stat icon={<Star size={16} />} label="Favorites received" value={String(profile.totalFavorites)} />
        </dl>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Approved Pawns</h2>
          <p className="mt-1 text-sm text-zinc-400">{profile.approvedPawns} approved {profile.approvedPawns === 1 ? 'Pawn' : 'Pawns'} shared by {profile.username}.</p>
        </div>

        {pawns.length === 0 ? <EmptyState title="This user has no approved Pawns yet." /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pawns.map((pawn) => (
            <PawnCard key={pawn.id} pawn={pawn} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-ash-900 p-4">
      <dt className="flex items-center gap-2 text-sm text-zinc-500">{icon}{label}</dt>
      <dd className="mt-2 text-lg font-semibold capitalize text-white">{value}</dd>
    </div>
  );
}
