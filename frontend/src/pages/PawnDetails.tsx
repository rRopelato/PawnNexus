import { Calendar, ChevronLeft, ChevronRight, Edit, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import type { Pawn, PawnImage, User } from '../types';

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
        <ImageCarousel images={pawn.images} pawnName={pawn.pawnName} />
        <section className="space-y-3">
          <h1 className="text-4xl font-semibold text-white">{pawn.pawnName}</h1>
          <p className="whitespace-pre-line leading-7 text-zinc-300">{pawn.description}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Weapon Skills</h2>
          <div className="flex flex-wrap gap-2">
            {(pawn.weaponSkills ?? pawn.skills).map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <DetailGroup title="Weapons" items={[
            ['Weapon 1', pawn.weapon1],
            ...(pawn.vocation === 'Fighter' ? [['Weapon 2', pawn.weapon2] as [string, string | null]] : []),
          ]} />
          <DetailGroup title="Armor" items={[
            ['Head', pawn.head],
            ['Body', pawn.body],
            ['Legs', pawn.legs],
            ['Cloak', pawn.cloak],
            ['Ring 1', pawn.ring1],
            ['Ring 2', pawn.ring2],
          ]} />
          <DetailGroup title="Augments" items={[
            ['Augment 1', pawn.augment1],
            ['Augment 2', pawn.augment2],
            ['Augment 3', pawn.augment3],
            ['Augment 4', pawn.augment4],
            ['Augment 5', pawn.augment5],
            ['Augment 6', pawn.augment6],
          ]} />
          <DetailGroup title="Specialization" items={[[ 'Specialization', pawn.specialization ]]} />
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
          <Info label={platformContact.label} value={platformContact.value} href={platformContact.href} />
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

function ImageCarousel({ images, pawnName }: { images: PawnImage[]; pawnName: string }) {
  const orderedImages = useMemo(() => [...images].sort((a, b) => a.sortOrder - b.sortOrder), [images]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set([0]));
  const [timerReset, setTimerReset] = useState(0);

  useEffect(() => {
    if (orderedImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % orderedImages.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [orderedImages.length, timerReset]);

  useEffect(() => {
    setLoaded((current) => new Set(current).add(index));
  }, [index]);

  if (orderedImages.length === 0) {
    return <div className="grid aspect-video place-items-center rounded border border-white/10 bg-ash-900 text-zinc-500">No screenshot</div>;
  }

  function selectImage(nextIndex: number) {
    setIndex(nextIndex);
    setTimerReset((value) => value + 1);
  }

  function move(direction: number) {
    selectImage((index + direction + orderedImages.length) % orderedImages.length);
  }

  return (
    <section className="overflow-hidden rounded border border-white/10 bg-ash-900">
      <div className="relative aspect-video bg-ash-850">
        {orderedImages.map((image, imageIndex) => (
          loaded.has(imageIndex) ? (
            <img
              key={image.imageUrl}
              src={image.imageUrl}
              alt={`${pawnName} screenshot ${imageIndex + 1}`}
              loading={imageIndex === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${imageIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            />
          ) : null
        ))}
        {orderedImages.length > 1 ? (
          <>
            <button className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded bg-ash-950/80 text-white" onClick={() => move(-1)} aria-label="Previous image" title="Previous image">
              <ChevronLeft size={22} />
            </button>
            <button className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded bg-ash-950/80 text-white" onClick={() => move(1)} aria-label="Next image" title="Next image">
              <ChevronRight size={22} />
            </button>
          </>
        ) : null}
      </div>
      {orderedImages.length > 1 ? (
        <div className="flex justify-center gap-2 border-t border-white/10 p-3">
          {orderedImages.map((image, imageIndex) => (
            <button
              key={image.thumbUrl}
              className={`h-2.5 w-2.5 rounded-full ${imageIndex === index ? 'bg-ember-500' : 'bg-white/20'}`}
              onClick={() => selectImage(imageIndex)}
              aria-label={`Show image ${imageIndex + 1}`}
              title={`Show image ${imageIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DetailGroup({ title, items }: { title: string; items: Array<[string, string | null]> }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map(([label, value]) => {
          const filled = value?.trim();
          return (
            <span key={label} className={filled ? 'tag' : 'tag border-white/5 bg-white/5 text-zinc-500'}>
              <span className="text-zinc-400">{label}:</span> {filled || 'Not filled'}
            </span>
          );
        })}
      </div>
    </section>
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
  if (pawn.platform === 'Steam') return { label: 'Steam', value: pawn.steamUrl || 'Not filled', href: pawn.steamUrl || undefined };
  if (pawn.platform === 'Nintendo Switch 2') return { label: 'Friend ID', value: pawn.switchFriendId || 'Not filled' };
  if (pawn.platform === 'PlayStation') return { label: 'PSN ID', value: pawn.psnId || 'Not filled' };
  if (pawn.platform === 'Xbox') return { label: 'Gamertag', value: pawn.xboxGamertag || 'Not filled' };
  return { label: 'Platform ID', value: 'Not filled' };
}
