import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../lib/api';

export function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const token = params.get('token') ?? '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password.length > 128) {
      setError('Password must be 128 characters or fewer.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setMessage('Password updated. You can log in with the new password.');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Choose a new password</h1>
        <p className="mt-2 text-zinc-400">Reset links expire after 1 hour.</p>
      </div>
      <form className="form-panel" onSubmit={submit} noValidate>
        {error ? <p className="alert">{error}</p> : null}
        {message ? <p className="alert border-emerald-500/30 bg-emerald-500/10 text-emerald-100">{message}</p> : null}
        <label>
          <span>New password</span>
          <input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>
          <span>Confirm password</span>
          <input autoComplete="new-password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </label>
        <button className="button-primary" disabled={busy}>{busy ? 'Working...' : 'Update password'}</button>
      </form>
      <Link className="text-sm text-ember-500 hover:text-ember-600" to="/login">Back to login</Link>
    </div>
  );
}
