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

  try {
    const payload = await verifyToken(c.env, token);
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
    });
    await next();
  } catch {
    throw new HTTPException(401, { message: 'Authentication required' });
  }
});

export const requireAdmin = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    throw new HTTPException(403, { message: 'Admin access required' });
  }

  await next();
});
