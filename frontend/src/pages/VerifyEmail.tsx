import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../lib/api';
import type { User } from '../types';

type Props = {
  onVerified: (user: User) => void;
};

export function VerifyEmail({ onVerified }: Props) {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    api
      .verifyEmail(token)
      .then((result) => {
        onVerified(result.user);
        setStatus('success');
        setMessage('Email verified. Your account can now add and manage Pawns.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Unable to verify email.');
      });
  }, [onVerified, params]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember-500">PawnNexus</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Email verification</h1>
      </div>
      <div className="form-panel">
        <p className={status === 'error' ? 'alert' : 'text-zinc-300'}>{message}</p>
        {status === 'success' ? <Link className="button-primary mt-5" to="/">Continue</Link> : null}
        {status === 'error' ? <Link className="button-secondary mt-5" to="/verify-required">Request a new link</Link> : null}
      </div>
    </div>
  );
}
