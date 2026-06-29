import { Calendar, Edit, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import type { Pawn, User } from '../types';

export function PawnDetails({ user }: { user: User | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pawn, setPawn] = useState<Pawn | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .pawn(id)
      .then((result) => setPawn(result.pawn))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawn'));
  }, [id]);

  async function remove() {
    if (!pawn) return;
    await api.deletePawn(pawn.id);
    navigate('/my-pawns');
  }

  async function refresh() {
    if (!pawn) return;
    setBusy(true);
    setError('');

    try {
      const result = await api.refreshPawn(pawn.id);
      setPawn(result.pawn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh pawn');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="alert">{error}</p>;
  if (!pawn) return <p className="text-zinc-400">Loading pawn...</p>;

  const canEdit = user && (user.id === pawn.userId || user.role === 'admin');
  const platformContact = getPlatformContact(pawn);

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded border border-white/10 bg-ash-900">
          {pawn.imageUrl ? (
            <img src={pawn.imageUrl} alt={pawn.pawnName} className="max-h-[680px] w-full object-cover" />
          ) : (
            <div className="grid aspect-video place-items-center text-zinc-500">No screenshot</div>
          )}
        </div>
        <section className="space-y-3">
          <h1 className="text-4xl font-semibold text-white">{pawn.pawnName}</h1>
          <p className="whitespace-pre-line leading-7 text-zinc-300">{pawn.description}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {pawn.skills.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-6 rounded border border-white/10 bg-ash-900 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Arisen</p>
            <p className="text-xl font-semibold text-white">{pawn.arisenName}</p>
          </div>
          <span className="tag">{pawn.status}</span>
        </div>

        <div className="rounded border border-white/10 bg-ash-850 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Star size={16} className="text-ember-500" /> Activity {pawn.activityStars}/3
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Refresh weekly to keep this pawn public. Pawns at 1 star stay visible to their owner but leave public browsing.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Info label="Platform" value={pawn.platform} />
          <Info label="Gender" value={pawn.gender} />
          <Info label="Race" value={pawn.race} />
          <Info label="Vocation" value={pawn.vocation} />
          <Info label="Level" value={String(pawn.level)} />
          <Info label="Inclination" value={pawn.inclination} />
          <Info label="Pawn ID" value={pawn.pawnId} />
          <Info label="Owner" value={pawn.ownerUsername} />
          {platformContact ? <Info label={platformContact.label} value={platformContact.value} href={platformContact.href} /> : null}
        </dl>

        <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-zinc-400">
          <p className="flex items-center gap-2">
            <Calendar size={16} /> Created {new Date(pawn.createdAt).toLocaleDateString()}
          </p>
          <p>Updated {new Date(pawn.updatedAt).toLocaleDateString()}</p>
          <p>Activity refreshed {new Date(pawn.lastRefreshedAt).toLocaleDateString()}</p>
        </div>

        {canEdit ? (
          <div className="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[1fr_auto_auto]">
            <button className="button-secondary" onClick={refresh} disabled={busy}>
              <RefreshCw size={16} /> {busy ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link className="button-secondary" to={`/pawns/${pawn.id}/edit`} aria-label="Edit pawn" title="Edit pawn">
              <Edit size={16} />
            </Link>
            <button className="button-danger" onClick={remove} aria-label="Delete pawn" title="Delete pawn">
              <Trash2 size={16} />
            </button>
          </div>
        ) : null}
      </aside>
    </article>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="break-words font-medium text-zinc-100">
        {href ? (
          <a className="text-ember-500 hover:text-ember-600" href={href} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function getPlatformContact(pawn: Pawn) {
  if (pawn.platform === 'Steam' && pawn.steamUrl) {
    return { label: 'Steam', value: pawn.steamUrl, href: pawn.steamUrl };
  }

  if (pawn.platform === 'Nintendo Switch' && pawn.switchFriendId) {
    return { label: 'Friend ID', value: pawn.switchFriendId };
  }

  if (pawn.platform === 'PlayStation' && pawn.psnId) {
    return { label: 'PSN ID', value: pawn.psnId };
  }

  if (pawn.platform === 'Xbox' && pawn.xboxGamertag) {
    return { label: 'Gamertag', value: pawn.xboxGamertag };
  }

  return null;
}
