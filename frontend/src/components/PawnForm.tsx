import { FormEvent, useState } from 'react';
import type { ReactNode } from 'react';
import { Upload } from 'lucide-react';
import type { Pawn } from '../types';
import { api } from '../lib/api';
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
  });
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
    setBusy(true);

    try {
      await onSubmit({
        ...payload,
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

  async function handleFile(file: File | null) {
    if (!file) return;
    setError('');
    setBusy(true);

    try {
      const result = await api.upload(file);
      update('imageUrl', result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload image');
    } finally {
      setBusy(false);
    }
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
            {pawnGenders.map((gender) => (
              <option key={gender}>{gender}</option>
            ))}
          </select>
        </Field>
        <Field label="Race">
          <select value={payload.race} onChange={(event) => update('race', event.target.value as Pawn['race'])}>
            {pawnRaces.map((race) => (
              <option key={race}>{race}</option>
            ))}
          </select>
        </Field>
        <Field label="Platform">
          <select value={payload.platform} onChange={(event) => updatePlatform(event.target.value as Pawn['platform'])}>
            {platforms.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>
        </Field>
        <Field label="Vocation">
          <select value={payload.vocation} onChange={(event) => update('vocation', event.target.value as Pawn['vocation'])}>
            {vocations.map((vocation) => (
              <option key={vocation}>{vocation}</option>
            ))}
          </select>
        </Field>
        <Field label="Level">
          <input
            min={1}
            max={999}
            required
            type="number"
            value={payload.level}
            onChange={(event) => update('level', Number(event.target.value))}
          />
        </Field>
        <Field label="Inclination">
          <select value={payload.inclination} onChange={(event) => update('inclination', event.target.value)}>
            {inclinations.map((inclination) => (
              <option key={inclination}>{inclination}</option>
            ))}
          </select>
        </Field>
        {payload.platform === 'Steam' ? (
          <Field label="Steam Profile URL">
            <input
              required
              type="url"
              placeholder="https://steamcommunity.com/id/your-profile"
              value={payload.steamUrl ?? ''}
              onChange={(event) => update('steamUrl', event.target.value)}
            />
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
        <textarea
          rows={5}
          required
          placeholder="Write one skill name per line, like High Frigor"
          value={skillsText}
          onChange={(event) => setSkillsText(event.target.value)}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={5}
          required
          value={payload.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-white/20 bg-ash-850 p-4 text-sm text-zinc-300 transition hover:border-ember-500/50">
          <Upload size={24} />
          Upload screenshot
          <input className="sr-only" type="file" accept="image/jpeg,image/jpg,image/png" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
        </label>
        <div className="min-h-40 overflow-hidden rounded border border-white/10 bg-ash-850">
          {payload.imageUrl ? (
            <img src={payload.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-zinc-500">No image selected</div>
          )}
        </div>
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
