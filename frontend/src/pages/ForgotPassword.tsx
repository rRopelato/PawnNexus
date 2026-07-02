import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    setError('');
    setMessage('');

    if (!emailPattern.test(value)) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      await api.forgotPassword(value);
      setMessage('If this email belongs to an active account, a reset link will arrive shortly.');
    } catch {
      setMessage('If this email belongs to an active account, a reset link will arrive shortly.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Reset password</h1>
        <p className="mt-2 text-zinc-400">Enter your account email and we will send a reset link if the account exists.</p>
      </div>
      <form className="form-panel" onSubmit={submit} noValidate>
        {error ? <p className="alert">{error}</p> : null}
        {message ? <p className="alert border-emerald-500/30 bg-emerald-500/10 text-emerald-100">{message}</p> : null}
        <label>
          <span>Email</span>
          <input autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button className="button-primary" disabled={busy}>{busy ? 'Working...' : 'Send reset link'}</button>
      </form>
      <Link className="text-sm text-ember-500 hover:text-ember-600" to="/login">Back to login</Link>
    </div>
  );
}
