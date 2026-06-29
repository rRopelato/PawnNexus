import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api, setToken } from '../lib/api';
import type { User } from '../types';

type Props = {
  mode: 'login' | 'register';
  onAuth: (user: User) => void;
};

type FieldErrors = {
  identifier?: string;
  username?: string;
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]+$/;
const maxPasswordLength = 128;

export function Auth({ mode, onAuth }: Props) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const validationErrors = mode === 'login'
      ? validateLoginForm(identifier, password)
      : validateRegisterForm(username, email, password);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError('Check the highlighted fields and try again.');
      return;
    }

    setBusy(true);

    try {
      const result = mode === 'login'
        ? await api.login(identifier.trim(), password)
        : await api.register(username.trim(), email.trim().toLowerCase(), password);
      setToken(result.token);
      onAuth(result.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  function clearField<K extends keyof FieldErrors>(key: K) {
    setError('');
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  const passwordHelp = mode === 'register'
    ? 'Use at least 8 characters. Avoid reusing a password from another site.'
    : 'Enter the password for your PawnNexus account.';

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">{mode === 'login' ? 'Login' : 'Create account'}</h1>
        <p className="mt-2 text-zinc-400">
          {mode === 'login' ? 'Use your username or email to manage your Pawns.' : 'Choose a public username and keep your email private.'}
        </p>
      </div>

      <form className="form-panel" onSubmit={submit} noValidate>
        {error ? <p className="alert">{error}</p> : null}

        {mode === 'login' ? (
          <label>
            <span>Username or Email</span>
            <input
              autoComplete="username"
              value={identifier}
              aria-invalid={Boolean(fieldErrors.identifier)}
              aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
              onBlur={() => setFieldErrors((current) => ({ ...current, identifier: validateIdentifier(identifier) }))}
              onChange={(event) => {
                setIdentifier(event.target.value);
                clearField('identifier');
              }}
            />
            {fieldErrors.identifier ? <FieldError id="identifier-error" message={fieldErrors.identifier} /> : null}
          </label>
        ) : (
          <>
            <label>
              <span>Username</span>
              <input
                autoComplete="username"
                value={username}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                onBlur={() => setFieldErrors((current) => ({ ...current, username: validateUsername(username) }))}
                onChange={(event) => {
                  setUsername(event.target.value);
                  clearField('username');
                }}
              />
              {fieldErrors.username ? <FieldError id="username-error" message={fieldErrors.username} /> : null}
            </label>

            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                inputMode="email"
                type="email"
                value={email}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                onBlur={() => setFieldErrors((current) => ({ ...current, email: validateEmail(email) }))}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearField('email');
                }}
              />
              {fieldErrors.email ? <FieldError id="email-error" message={fieldErrors.email} /> : null}
            </label>
          </>
        )}

        <label>
          <span>Password</span>
          <input
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            type="password"
            value={password}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : 'password-help'}
            onBlur={() => setFieldErrors((current) => ({ ...current, password: validatePassword(password) }))}
            onChange={(event) => {
              setPassword(event.target.value);
              clearField('password');
            }}
          />
          <p id="password-help" className="mt-2 text-sm text-zinc-500">
            {passwordHelp}
          </p>
          {fieldErrors.password ? <FieldError id="password-error" message={fieldErrors.password} /> : null}
        </label>

        <button className="button-primary" disabled={busy}>
          {busy ? 'Working...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <p className="text-sm text-zinc-400">
        {mode === 'login' ? 'Need an account?' : 'Already have an account?'}{' '}
        <Link className="text-ember-500 hover:text-ember-600" to={mode === 'login' ? '/register' : '/login'}>
          {mode === 'login' ? 'Register' : 'Login'}
        </Link>
      </p>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-2 text-sm text-red-200">
      {message}
    </p>
  );
}

function validateLoginForm(identifier: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const identifierError = validateIdentifier(identifier);
  const passwordError = validatePassword(password);

  if (identifierError) errors.identifier = identifierError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

function validateRegisterForm(username: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const usernameError = validateUsername(username);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (usernameError) errors.username = usernameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

function validateIdentifier(value: string) {
  const identifier = value.trim();
  if (!identifier) return 'Username or email is required.';
  return identifier.includes('@') ? validateEmail(identifier) : validateUsername(identifier);
}

function validateUsername(username: string) {
  const value = username.trim();
  if (!value) return 'Username is required.';
  if (value.length < 3) return 'Username must be at least 3 characters.';
  if (value.length > 24) return 'Username must be 24 characters or fewer.';
  if (!usernamePattern.test(value)) return 'Username may only contain letters, numbers, and underscores.';
  return undefined;
}

function validateEmail(email: string) {
  const value = email.trim();
  if (!value) return 'Email is required.';
  if (value.length > 254) return 'Email must be 254 characters or fewer.';
  if (!emailPattern.test(value)) return 'Enter a valid email address, like arisen@example.com.';
  return undefined;
}

function validatePassword(password: string) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > maxPasswordLength) return `Password must be ${maxPasswordLength} characters or fewer.`;
  return undefined;
}
