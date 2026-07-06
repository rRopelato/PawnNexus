import { Bookmark, Calendar, ChevronLeft, ChevronRight, Edit, Heart, MessageSquare, RefreshCw, Send, Shield, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import type { Pawn, PawnComment, PawnImage, User } from '../types';

export function PawnDetails({ user }: { user: User | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pawn, setPawn] = useState<Pawn | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [comments, setComments] = useState<PawnComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (!id) return;

    api
      .pawn(id)
      .then((result) => {
        setPawn(result.pawn);
        return api.pawnComments(result.pawn.id);
      })
      .then((result) => {
        setComments(result.comments);
        setCommentError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawn'));
  }, [id]);

  async function remove() {
    if (!pawn) return;
    await api.deletePawn(pawn.id);
    navigate('/my-pawns');
  }

  async function toggleLike() {
    if (!pawn) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.emailVerifiedAt) {
      navigate('/verify-required');
      return;
    }

    setReactionBusy(true);
    setError('');
    try {
      const result = pawn.userLiked ? await api.unlikePawn(pawn.id) : await api.likePawn(pawn.id);
      setPawn(result.pawn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update like');
    } finally {
      setReactionBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!pawn) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.emailVerifiedAt) {
      navigate('/verify-required');
      return;
    }

    setReactionBusy(true);
    setError('');
    try {
      const result = pawn.userFavorited ? await api.unfavoritePawn(pawn.id) : await api.favoritePawn(pawn.id);
      setPawn(result.pawn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update favorite');
    } finally {
      setReactionBusy(false);
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pawn) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.emailVerifiedAt) {
      navigate('/verify-required');
      return;
    }

    setCommentBusy(true);
    setCommentError('');
    try {
      const result = await api.createPawnComment(pawn.id, commentBody);
      setComments((current) => [...current, result.comment]);
      setCommentBody('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Unable to post comment');
    } finally {
      setCommentBusy(false);
    }
  }

  async function deleteComment(comment: PawnComment) {
    if (!pawn) return;

    setCommentBusy(true);
    setCommentError('');
    try {
      await api.deletePawnComment(pawn.id, comment.id);
      setComments((current) => current.filter((item) => item.id !== comment.id));
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Unable to delete comment');
    } finally {
      setCommentBusy(false);
    }
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
  const ownerProfileUrl = '/users/' + encodeURIComponent(pawn.ownerUsername);
  const weaponSkills = pawn.weaponSkills?.length ? pawn.weaponSkills : pawn.skills;
  const weapons: Array<[string, string | null]> = [
    ['Weapon 1', pawn.weapon1],
    ...(pawn.vocation === 'Fighter' ? [['Weapon 2', pawn.weapon2] as [string, string | null]] : []),
  ];
  const armor: Array<[string, string | null]> = [
    ['Head', pawn.head],
    ['Body', pawn.body],
    ['Legs', pawn.legs],
    ['Cloak', pawn.cloak],
    ['Ring 1', pawn.ring1],
    ['Ring 2', pawn.ring2],
  ];
  const augments: Array<[string, string | null]> = [
    ['Augment 1', pawn.augment1],
    ['Augment 2', pawn.augment2],
    ['Augment 3', pawn.augment3],
    ['Augment 4', pawn.augment4],
    ['Augment 5', pawn.augment5],
    ['Augment 6', pawn.augment6],
  ];

  return (
    <article className="space-y-8">
      <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-ember-500">Pawn profile</p>
            <h1 className="text-4xl font-semibold text-white md:text-6xl">{pawn.pawnName}</h1>
            <p className="text-lg text-zinc-300">
              Arisen Name -{' '}
              <Link className="text-ember-500 hover:text-ember-600" to={ownerProfileUrl}>
                {pawn.arisenName}
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="tag">{pawn.vocation}</span>
            <span className="tag">{pawn.gender}</span>
            <span className="tag">{pawn.race}</span>
            <span className="tag">{pawn.inclination}</span>
          </div>
        </div>

        <div className="rounded border border-white/10 bg-ash-900 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Star size={16} className="text-ember-500" /> Activity {pawn.activityStars}/3
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Refresh weekly to keep this pawn public. Pawns at 1 star stay visible to their owner but leave public browsing.
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <ProfileSection title="Images">
            <ImageCarousel images={pawn.images} pawnName={pawn.pawnName} />
          </ProfileSection>

          <ProfileSection title="Description">
            <p className="whitespace-pre-line leading-7 text-zinc-300">{pawn.description || 'Not filled'}</p>
          </ProfileSection>

          <ProfileSection title="Equipment">
            <div className="grid gap-5 md:grid-cols-2">
              <FieldChips title="Weapons" items={weapons} />
              <FieldChips title="Armor" items={armor} />
            </div>
          </ProfileSection>

          <ProfileSection title="Weapon Skills">
            <ValueChips values={weaponSkills} emptyLabel="No weapon skills filled" />
          </ProfileSection>

          <ProfileSection title="Augments">
            <FieldChips items={augments} />
          </ProfileSection>

          <ProfileSection title="Specialization">
            <ValueChips values={[pawn.specialization].filter(Boolean) as string[]} emptyLabel="Not filled" />
          </ProfileSection>

          <ProfileSection title="Comments">
            <CommentsPanel
              comments={comments}
              body={commentBody}
              error={commentError}
              busy={commentBusy}
              pawn={pawn}
              user={user}
              onBodyChange={setCommentBody}
              onSubmit={submitComment}
              onDelete={deleteComment}
            />
          </ProfileSection>
        </div>

        <aside className="h-fit space-y-5 rounded border border-white/10 bg-ash-900 p-5 lg:sticky lg:top-24">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Shield size={18} className="text-ember-500" /> Pawn info
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Owner" value={pawn.ownerUsername} to={ownerProfileUrl} />
              <Info label="Pawn ID" value={pawn.pawnId} />
              <Info label="Platform" value={pawn.platform} />
              <Info label="Vocation" value={pawn.vocation} />
              <Info label="Level" value={String(pawn.level)} />
              <Info label="Inclination" value={pawn.inclination} />
              <Info label="Gender" value={pawn.gender} />
              <Info label="Race" value={pawn.race} />
            </dl>
          </section>

          <section className="space-y-3 border-t border-white/10 pt-5">
            <h2 className="text-lg font-semibold text-white">Platform IDs</h2>
            <dl className="grid gap-3 text-sm">
              <Info label={platformContact.label} value={platformContact.value} href={platformContact.href} />
            </dl>
          </section>

          <section className="space-y-3 border-t border-white/10 pt-5">
            <h2 className="text-lg font-semibold text-white">Community</h2>
            <div className="grid grid-cols-2 gap-2">
              <button className="button-secondary justify-center" type="button" onClick={toggleLike} disabled={reactionBusy}>
                <Heart size={16} className={pawn.userLiked ? 'fill-ember-500 text-ember-500' : ''} /> {pawn.likesCount}
              </button>
              <button className="button-secondary justify-center" type="button" onClick={toggleFavorite} disabled={reactionBusy}>
                <Bookmark size={16} className={pawn.userFavorited ? 'fill-ember-500 text-ember-500' : ''} /> {pawn.favoritesCount}
              </button>
            </div>
          </section>

          <section className="space-y-2 border-t border-white/10 pt-5 text-sm text-zinc-400">
            <p className="flex items-center gap-2">
              <Calendar size={16} /> Created {new Date(pawn.createdAt).toLocaleDateString()}
            </p>
            <p>Updated {new Date(pawn.updatedAt).toLocaleDateString()}</p>
            <p>Activity refreshed {new Date(pawn.lastRefreshedAt).toLocaleDateString()}</p>
          </section>

          {canEdit ? (
            <div className="grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-[1fr_auto_auto]">
              <button className="button-secondary" onClick={refresh} disabled={busy}>
                <RefreshCw size={16} /> {busy ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link className="button-secondary" to={'/pawns/' + pawn.id + '/edit'} aria-label="Edit pawn" title="Edit pawn">
                <Edit size={16} />
              </Link>
              <button className="button-danger" onClick={remove} aria-label="Delete pawn" title="Delete pawn">
                <Trash2 size={16} />
              </button>
            </div>
          ) : null}
        </aside>
      </div>
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
              alt={pawnName + ' screenshot ' + (imageIndex + 1)}
              loading={imageIndex === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={'absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ' + (imageIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0')}
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
              className={'h-2.5 w-2.5 rounded-full ' + (imageIndex === index ? 'bg-ember-500' : 'bg-white/20')}
              onClick={() => selectImage(imageIndex)}
              aria-label={'Show image ' + (imageIndex + 1)}
              title={'Show image ' + (imageIndex + 1)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function FieldChips({ title, items }: { title?: string; items: Array<[string, string | null]> }) {
  return (
    <div className="space-y-3">
      {title ? <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">{title}</h3> : null}
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
    </div>
  );
}

function ValueChips({ values, emptyLabel }: { values: string[]; emptyLabel: string }) {
  const filled = values.map((value) => value.trim()).filter(Boolean);
  if (filled.length === 0) return <span className="tag border-white/5 bg-white/5 text-zinc-500">{emptyLabel}</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {filled.map((value) => <span key={value} className="tag">{value}</span>)}
    </div>
  );
}

function CommentsPanel({
  comments,
  body,
  error,
  busy,
  pawn,
  user,
  onBodyChange,
  onSubmit,
  onDelete,
}: {
  comments: PawnComment[];
  body: string;
  error: string;
  busy: boolean;
  pawn: Pawn;
  user: User | null;
  onBodyChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (comment: PawnComment) => void;
}) {
  const canComment = Boolean(user?.emailVerifiedAt);

  return (
    <div className="space-y-4">
      {user ? (
        canComment ? (
          <form className="space-y-3" onSubmit={onSubmit}>
            <textarea
              className="min-h-28"
              maxLength={1000}
              placeholder="Write a comment"
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">{body.trim().length}/1000</span>
              <button className="button-primary" type="submit" disabled={busy || body.trim().length === 0}>
                <Send size={16} /> Comment
              </button>
            </div>
          </form>
        ) : (
          <p className="rounded border border-white/10 bg-ash-900 p-4 text-sm text-zinc-400">Verify your email to comment.</p>
        )
      ) : (
        <p className="rounded border border-white/10 bg-ash-900 p-4 text-sm text-zinc-400">Log in with a verified account to comment.</p>
      )}

      {error ? <p className="alert">{error}</p> : null}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded border border-dashed border-white/10 bg-ash-950/40 p-5 text-sm text-zinc-400">
            <p className="flex items-center gap-2 font-medium text-zinc-200">
              <MessageSquare size={16} className="text-ember-500" /> No comments yet.
            </p>
            <p className="mt-2">Be the first verified user to leave a note about this Pawn.</p>
          </div>
        ) : null}

        {comments.map((comment) => {
          const canDelete = Boolean(user && (user.role === 'admin' || user.role === 'moderator' || user.id === pawn.userId || user.id === comment.userId));
          return (
            <article key={comment.id} className="rounded border border-white/10 bg-ash-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-white">{comment.username}</p>
                  <p className="text-xs text-zinc-500">{new Date(comment.createdAt).toLocaleDateString()}</p>
                </div>
                {canDelete ? (
                  <button className="icon-button" type="button" onClick={() => onDelete(comment)} disabled={busy} aria-label="Delete comment" title="Delete comment">
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-zinc-300">{comment.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value, href, to }: { label: string; value: string; href?: string; to?: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="break-words font-medium text-zinc-100">
        {to ? (
          <Link className="text-ember-500 hover:text-ember-600" to={to}>
            {value}
          </Link>
        ) : href ? (
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
