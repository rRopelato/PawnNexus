import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api';
import type { User } from '../types';

type Props = {
  user: User;
  onUserUpdate: (user: User) => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function VerifyRequired({ user, onUserUpdate }: Props) {
  const [email, setEmail] = useState(user.pendingEmail ?? user.email);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await api.resendVerification();
      onUserUpdate(result.user);
      setMessage('Verification email sent. If you just requested one, wait a few minutes before trying again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification email');
    } finally {
      setBusy(false);
    }
  }

  async function changeEmail(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    setError('');
    setMessage('');

    if (!emailPattern.test(nextEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      const result = await api.changeEmail(nextEmail);
      onUserUpdate(result.user);
      setMessage('Email updated. Check the new inbox for the verification link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change email');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ember-500">Email verification</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Verify your email to continue</h1>
        <p className="mt-3 text-zinc-400">
          You can browse Pawns while logged in, but adding, editing, uploading images, refreshing Pawns, and moderation tools require a verified email.
        </p>
      </div>

      <section className="form-panel space-y-5">
        {message ? <p className="alert border-emerald-500/30 bg-emerald-500/10 text-emerald-100">{message}</p> : null}
        {error ? <p className="alert">{error}</p> : null}

        <div className="rounded border border-white/10 bg-ash-850 p-4 text-sm text-zinc-300">
          Current email: <span className="font-medium text-white">{user.pendingEmail ?? user.email}</span>
        </div>

        <button className="button-primary" onClick={resend} disabled={busy}>
          {busy ? 'Working...' : 'Resend verification email'}
        </button>

        <form className="space-y-4 border-t border-white/10 pt-5" onSubmit={changeEmail} noValidate>
          <label>
            <span>Change email</span>
            <input
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button className="button-secondary" disabled={busy}>
            Send verification to this email
          </button>
        </form>
      </section>

      <p className="text-sm text-zinc-500">
        Already verified? <Link className="text-ember-500 hover:text-ember-600" to="/login">Log in again</Link>.
      </p>
    </div>
  );
}
