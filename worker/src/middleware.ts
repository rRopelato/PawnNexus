import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { getUserById, isEmailBanned } from './db';
import { verifyToken } from './auth';
import type { Env, Variables } from './types';

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const payload = await verifyToken(c.env, token).catch(() => null);
  if (!payload) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const user = await getUserById(c.env.DB, payload.id);
  if (!user || user.status !== 'active' || (await isEmailBanned(c.env.DB, user.email))) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  c.set('user', {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.email_verified_at ?? null,
    pendingEmail: user.pending_email ?? null,
  });
  await next();
});

export const requireVerified = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
  const user = c.get('user');
  if (!user.emailVerifiedAt) {
    throw new HTTPException(403, { message: 'Email verification required' });
  }

  await next();
});

export const requireAdmin = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
  const user = c.get('user');
  if (!user.emailVerifiedAt) {
    throw new HTTPException(403, { message: 'Email verification required' });
  }
  if (user.role !== 'admin') {
    throw new HTTPException(403, { message: 'Admin access required' });
  }

  await next();
});

export const requireModerator = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
  const user = c.get('user');
  if (!user.emailVerifiedAt) {
    throw new HTTPException(403, { message: 'Email verification required' });
  }
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw new HTTPException(403, { message: 'Moderator access required' });
  }

  await next();
});
