import { FormEvent, useState } from 'react';
import type { ReactNode } from 'react';
import { Upload, X } from 'lucide-react';
import type { Pawn, PawnImage } from '../types';
import { api } from '../lib/api';
import { processPawnImages } from '../lib/images';
import { inclinations, pawnGenders, pawnRaces, platforms, vocations } from '../lib/constants';

type Props = {
  initial?: Partial<Pawn>;
  onSubmit: (payload: Partial<Pawn>) => Promise<void>;
};

export function PawnForm({ initial, onSubmit }: Props) {
  const [payload, setPayload] = useState<Partial<Pawn>>({
    pawnName: initial?.pawnName ?? '',
    arisenName: initial?.arisenName ?? '',
    gender: initial?.gender ?? 'Unspecified',
    race: initial?.race ?? 'Human',
    platform: initial?.platform ?? 'Steam',
    vocation: initial?.vocation ?? 'Fighter',
    level: initial?.level ?? 1,
    inclination: initial?.inclination ?? 'Kindhearted',
    skills: initial?.skills ?? [],
    description: initial?.description ?? '',
    pawnId: initial?.pawnId ?? '',
    steamUrl: initial?.steamUrl ?? '',
    switchFriendId: initial?.switchFriendId ?? '',
    psnId: initial?.psnId ?? '',
    xboxGamertag: initial?.xboxGamertag ?? '',
    imageUrl: initial?.imageUrl ?? '',
    thumbnailUrl: initial?.thumbnailUrl ?? '',
    images: initial?.images ?? [],
  });
  const [images, setImages] = useState<PawnImage[]>(initial?.images ?? []);
  const [skillsText, setSkillsText] = useState((initial?.skills ?? []).join('\n'));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update<K extends keyof Pawn>(key: K, value: Pawn[K]) {
    setPayload((current) => ({ ...current, [key]: value }));
  }

  function updatePlatform(platform: Pawn['platform']) {
    setPayload((current) => ({
      ...current,
      platform,
      steamUrl: platform === 'Steam' ? current.steamUrl : '',
      switchFriendId: platform === 'Nintendo Switch' ? current.switchFriendId : '',
      psnId: platform === 'PlayStation' ? current.psnId : '',
      xboxGamertag: platform === 'Xbox' ? current.xboxGamertag : '',
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (images.length === 0) {
      setError('Upload at least one image.');
      return;
    }

    setBusy(true);

    try {
      await onSubmit({
        ...payload,
        imageUrl: images[0].imageUrl,
        thumbnailUrl: images[0].thumbUrl,
        images,
        skills: skillsText
          .split('\n')
          .map((skill) => skill.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save pawn');
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    setError('');
    setBusy(true);

    try {
      const remaining = 5 - images.length;
      if (files.length > remaining) throw new Error(`You can add ${remaining} more image(s).`);
      const processed = await processPawnImages(files);
      const result = await api.upload(processed);
      setImages((current) => [...current, ...result.images].map((image, index) => ({ ...image, sortOrder: index })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload images');
    } finally {
      setBusy(false);
    }
  }

  function removeImage(sortOrder: number) {
    setImages((current) => current.filter((image) => image.sortOrder !== sortOrder).map((image, index) => ({ ...image, sortOrder: index })));
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      {error ? <p className="alert">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Pawn Name">
          <input required value={payload.pawnName} onChange={(event) => update('pawnName', event.target.value)} />
        </Field>
        <Field label="Arisen Name">
          <input required value={payload.arisenName} onChange={(event) => update('arisenName', event.target.value)} />
        </Field>
        <Field label="Gender">
          <select value={payload.gender} onChange={(event) => update('gender', event.target.value as Pawn['gender'])}>
            {pawnGenders.map((gender) => <option key={gender}>{gender}</option>)}
          </select>
        </Field>
        <Field label="Race">
          <select value={payload.race} onChange={(event) => update('race', event.target.value as Pawn['race'])}>
            {pawnRaces.map((race) => <option key={race}>{race}</option>)}
          </select>
        </Field>
        <Field label="Platform">
          <select value={payload.platform} onChange={(event) => updatePlatform(event.target.value as Pawn['platform'])}>
            {platforms.map((platform) => <option key={platform}>{platform}</option>)}
          </select>
        </Field>
        <Field label="Vocation">
          <select value={payload.vocation} onChange={(event) => update('vocation', event.target.value as Pawn['vocation'])}>
            {vocations.map((vocation) => <option key={vocation}>{vocation}</option>)}
          </select>
        </Field>
        <Field label="Level">
          <input min={1} max={999} required type="number" value={payload.level} onChange={(event) => update('level', Number(event.target.value))} />
        </Field>
        <Field label="Inclination">
          <select value={payload.inclination} onChange={(event) => update('inclination', event.target.value)}>
            {inclinations.map((inclination) => <option key={inclination}>{inclination}</option>)}
          </select>
        </Field>
        {payload.platform === 'Steam' ? (
          <Field label="Steam Profile URL">
            <input required type="url" placeholder="https://steamcommunity.com/id/your-profile" value={payload.steamUrl ?? ''} onChange={(event) => update('steamUrl', event.target.value)} />
          </Field>
        ) : null}
        {payload.platform === 'Nintendo Switch' ? (
          <Field label="Switch Friend ID">
            <input required placeholder="SW-0000-0000-0000" value={payload.switchFriendId ?? ''} onChange={(event) => update('switchFriendId', event.target.value)} />
          </Field>
        ) : null}
        {payload.platform === 'PlayStation' ? (
          <Field label="PSN ID">
            <input required value={payload.psnId ?? ''} onChange={(event) => update('psnId', event.target.value)} />
          </Field>
        ) : null}
        {payload.platform === 'Xbox' ? (
          <Field label="Gamertag">
            <input required value={payload.xboxGamertag ?? ''} onChange={(event) => update('xboxGamertag', event.target.value)} />
          </Field>
        ) : null}
      </div>

      <Field label="Pawn ID">
        <input required value={payload.pawnId} onChange={(event) => update('pawnId', event.target.value)} />
      </Field>

      <Field label="Skills">
        <textarea rows={5} required placeholder="Write one skill name per line, like High Frigor" value={skillsText} onChange={(event) => setSkillsText(event.target.value)} />
      </Field>

      <Field label="Description">
        <textarea rows={5} required value={payload.description} onChange={(event) => update('description', event.target.value)} />
      </Field>

      <div className="space-y-4">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-white/20 bg-ash-850 p-4 text-sm text-zinc-300 transition hover:border-ember-500/50">
          <Upload size={24} />
          Upload up to 5 images
          <span className="text-xs text-zinc-500">JPG, JPEG, PNG, or WebP. 5 MB each. Converted to WebP automatically.</span>
          <input className="sr-only" multiple type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(event) => handleFiles(event.target.files)} />
        </label>
        {images.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {images.map((image, index) => (
              <div key={image.thumbUrl} className="relative overflow-hidden rounded border border-white/10 bg-ash-850">
                <img src={image.thumbUrl} alt={`Pawn image ${index + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <button type="button" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded bg-ash-950/80 text-white" onClick={() => removeImage(image.sortOrder)} aria-label="Remove image" title="Remove image">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <button className="button-primary w-full md:w-auto" disabled={busy}>
        {busy ? 'Saving...' : 'Save Pawn'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2 text-sm text-zinc-300">
      <span>{label}</span>
      {children}
    </label>
  );
}
