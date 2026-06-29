import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PawnForm } from '../components/PawnForm';
import { api } from '../lib/api';
import type { Pawn } from '../types';

export function PawnEditor({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pawn, setPawn] = useState<Pawn | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && id) {
      api
        .pawn(id)
        .then((result) => setPawn(result.pawn))
        .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pawn'));
    }
  }, [id, mode]);

  async function submit(payload: Partial<Pawn>) {
    const result = mode === 'edit' && id ? await api.updatePawn(id, payload) : await api.createPawn(payload);
    navigate(`/pawns/${result.pawn.id}`);
  }

  if (error) return <p className="alert">{error}</p>;
  if (mode === 'edit' && !pawn) return <p className="text-zinc-400">Loading pawn...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">{mode === 'edit' ? 'Edit Pawn' : 'Add Pawn'}</h1>
        <p className="mt-2 text-zinc-400">Saved pawns enter moderation before appearing in public browsing.</p>
      </div>
      <PawnForm initial={pawn ?? undefined} onSubmit={submit} />
    </div>
  );
}
