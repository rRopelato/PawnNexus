import { FormEvent, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Upload, X } from 'lucide-react';
import type { Pawn, PawnImage } from '../types';
import { api } from '../lib/api';
import { processPawnImages } from '../lib/images';
import { inclinations, pawnGenders, pawnRaces, platforms, specializations, vocations } from '../lib/constants';

type Props = {
  initial?: Partial<Pawn>;
  onSubmit: (payload: Partial<Pawn>) => Promise<void>;
};

const emptyWeaponSkills = ['', '', '', ''];
const emptyAugments = ['', '', '', '', '', ''];

export function PawnForm({ initial, onSubmit }: Props) {
  const initialPlatform = initial?.platform as string | undefined;
  const initialImages = [...(initial?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map((image, sortOrder) => ({ ...image, sortOrder }));
  const initialWeaponSkills = [...(initial?.weaponSkills ?? initial?.skills ?? []), ...emptyWeaponSkills].slice(0, 4);
  const initialAugments = [initial?.augment1, initial?.augment2, initial?.augment3, initial?.augment4, initial?.augment5, initial?.augment6].map((value) => value ?? '');
  const [payload, setPayload] = useState<Partial<Pawn>>({
    pawnName: initial?.pawnName ?? '',
    arisenName: initial?.arisenName ?? '',
    gender: initial?.gender ?? 'Unspecified',
    race: initial?.race ?? 'Human',
    platform: initialPlatform === 'Nintendo Switch' ? 'Nintendo Switch 2' : (initial?.platform ?? 'Steam'),
    vocation: initial?.vocation ?? 'Fighter',
    level: initial?.level ?? 1,
    inclination: initial?.inclination ?? 'Kindhearted',
    description: initial?.description ?? '',
    pawnId: initial?.pawnId ?? '',
    steamUrl: initial?.steamUrl ?? '',
    switchFriendId: initial?.switchFriendId ?? '',
    psnId: initial?.psnId ?? '',
    xboxGamertag: initial?.xboxGamertag ?? '',
    weapon1: initial?.weapon1 ?? '',
    weapon2: initial?.weapon2 ?? '',
    head: initial?.head ?? '',
    body: initial?.body ?? '',
    legs: initial?.legs ?? '',
    cloak: initial?.cloak ?? '',
    ring1: initial?.ring1 ?? '',
    ring2: initial?.ring2 ?? '',
    specialization: initial?.specialization ?? '',
    imageUrl: initial?.imageUrl ?? '',
    thumbnailUrl: initial?.thumbnailUrl ?? '',
    images: initialImages,
  });
  const [weaponSkills, setWeaponSkills] = useState(initialWeaponSkills);
  const [augments, setAugments] = useState(initialAugments);
  const [images, setImages] = useState<PawnImage[]>(initialImages);
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
      switchFriendId: platform === 'Nintendo Switch 2' ? current.switchFriendId : '',
      psnId: platform === 'PlayStation' ? current.psnId : '',
      xboxGamertag: platform === 'Xbox' ? current.xboxGamertag : '',
    }));
  }

  function updateVocation(vocation: Pawn['vocation']) {
    setPayload((current) => ({ ...current, vocation, weapon2: vocation === 'Fighter' ? current.weapon2 : '' }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (images.length === 0) {
      setError('Upload at least one image.');
      return;
    }

    const normalizedWeaponSkills = weaponSkills.map((skill) => skill.trim()).filter(Boolean);
    if (normalizedWeaponSkills.length === 0) {
      setError('Add at least one weapon skill.');
      return;
    }

    setBusy(true);

    try {
      await onSubmit({
        ...payload,
        imageUrl: images[0].imageUrl,
        thumbnailUrl: images[0].thumbUrl,
        images,
        weaponSkills: normalizedWeaponSkills,
        skills: normalizedWeaponSkills,
        augment1: augments[0].trim(),
        augment2: augments[1].trim(),
        augment3: augments[2].trim(),
        augment4: augments[3].trim(),
        augment5: augments[4].trim(),
        augment6: augments[5].trim(),
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

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      const moving = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = moving;
      return next.map((image, sortOrder) => ({ ...image, sortOrder }));
    });
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
          <select value={payload.vocation} onChange={(event) => updateVocation(event.target.value as Pawn['vocation'])}>
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
        <Field label="Specialization">
          <select value={payload.specialization ?? ''} onChange={(event) => update('specialization', event.target.value)}>
            <option value="">No specialization</option>
            {specializations.map((specialization) => <option key={specialization}>{specialization}</option>)}
          </select>
        </Field>
        {payload.platform === 'Steam' ? (
          <Field label="Steam Profile URL">
            <input type="url" placeholder="https://steamcommunity.com/id/your-profile" value={payload.steamUrl ?? ''} onChange={(event) => update('steamUrl', event.target.value)} />
          </Field>
        ) : null}
        {payload.platform === 'Nintendo Switch 2' ? (
          <Field label="Switch Friend ID">
            <input placeholder="SW-0000-0000-0000" value={payload.switchFriendId ?? ''} onChange={(event) => update('switchFriendId', event.target.value)} />
          </Field>
        ) : null}
        {payload.platform === 'PlayStation' ? (
          <Field label="PSN ID">
            <input value={payload.psnId ?? ''} onChange={(event) => update('psnId', event.target.value)} />
          </Field>
        ) : null}
        {payload.platform === 'Xbox' ? (
          <Field label="Gamertag">
            <input value={payload.xboxGamertag ?? ''} onChange={(event) => update('xboxGamertag', event.target.value)} />
          </Field>
        ) : null}
      </div>

      <Field label="Pawn ID">
        <input required value={payload.pawnId} onChange={(event) => update('pawnId', event.target.value)} />
      </Field>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Weapon Skills</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {weaponSkills.map((skill, index) => (
            <Field key={index} label={`Weapon Skill ${index + 1}`}>
              <input value={skill} onChange={(event) => setWeaponSkills((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} />
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Equipment</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Weapon 1"><input value={payload.weapon1 ?? ''} onChange={(event) => update('weapon1', event.target.value)} /></Field>
          {payload.vocation === 'Fighter' ? <Field label="Weapon 2"><input value={payload.weapon2 ?? ''} onChange={(event) => update('weapon2', event.target.value)} /></Field> : null}
          <Field label="Head"><input value={payload.head ?? ''} onChange={(event) => update('head', event.target.value)} /></Field>
          <Field label="Body"><input value={payload.body ?? ''} onChange={(event) => update('body', event.target.value)} /></Field>
          <Field label="Legs"><input value={payload.legs ?? ''} onChange={(event) => update('legs', event.target.value)} /></Field>
          <Field label="Cloak"><input value={payload.cloak ?? ''} onChange={(event) => update('cloak', event.target.value)} /></Field>
          <Field label="Ring 1"><input value={payload.ring1 ?? ''} onChange={(event) => update('ring1', event.target.value)} /></Field>
          <Field label="Ring 2"><input value={payload.ring2 ?? ''} onChange={(event) => update('ring2', event.target.value)} /></Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Augments</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {augments.map((augment, index) => (
            <Field key={index} label={`Augment ${index + 1}`}>
              <input value={augment} onChange={(event) => setAugments((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} />
            </Field>
          ))}
        </div>
      </section>


      <Field label="Description">
        <textarea rows={5} required value={payload.description} onChange={(event) => update('description', event.target.value)} />
      </Field>

      <div className="space-y-4">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-white/20 bg-ash-850 p-4 text-sm text-zinc-300 transition hover:border-ember-500/50">
          <Upload size={24} />
          Upload up to 5 images
          <span className="text-xs text-zinc-500">JPG, JPEG, PNG, or WebP. 5 MB each. WebP preferred, JPEG fallback on mobile.</span>
          <input className="sr-only" multiple type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(event) => handleFiles(event.target.files)} />
        </label>
        {images.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {images.map((image, index) => (
              <div key={image.thumbUrl} className="overflow-hidden rounded border border-white/10 bg-ash-850">
                <div className="relative">
                  <img src={image.thumbUrl} alt={`Pawn image ${index + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  {index === 0 ? <span className="absolute left-2 top-2 rounded bg-ember-500 px-2 py-1 text-xs font-semibold text-ash-950">Main</span> : null}
                  <button type="button" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded bg-ash-950/80 text-white" onClick={() => removeImage(image.sortOrder)} aria-label="Remove image" title="Remove image">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-2">
                  <button type="button" className="button-secondary justify-center px-2 py-2" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Move image left" title="Move image left">
                    <ArrowLeft size={16} />
                  </button>
                  <button type="button" className="button-secondary justify-center px-2 py-2" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Move image right" title="Move image right">
                    <ArrowRight size={16} />
                  </button>
                </div>
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
