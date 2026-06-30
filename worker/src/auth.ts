import { SignJWT, jwtVerify } from 'jose';
import type { AuthUser, Env } from './types';

const encoder = new TextEncoder();

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    key,
    256,
  );

  return `pbkdf2$100000$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationsValue, saltValue, hashValue] = stored.split('$');
  if (algorithm !== 'pbkdf2') return false;

  const salt = fromBase64(saltValue);
  const expected = fromBase64(hashValue);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: Number(iterationsValue),
      hash: 'SHA-256',
    },
    key,
    expected.length * 8,
  );

  return constantTimeEqual(new Uint8Array(bits), expected);
}

export async function signToken(env: Env, user: AuthUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encoder.encode(env.JWT_SECRET));
}

export async function verifyToken(env: Env, token: string) {
  const result = await jwtVerify<AuthUser>(token, encoder.encode(env.JWT_SECRET));
  return result.payload;
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}
