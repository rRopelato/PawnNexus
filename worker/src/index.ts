import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { createSecureToken, hashPassword, hashToken, signToken, verifyPassword, verifyToken } from './auth';
import {
  canManagePawn,
  decayPawnActivity,
  getPawnById,
  getUserByEmail,
  getUserByEmailOrPendingEmail,
  getUserById,
  getUserByLogin,
  getUserByUsername,
  isEmailBanned,
  publicPawn,
  publicUser,
} from './db';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';
import { requireAdmin, requireAuth, requireModerator, requireVerified } from './middleware';
import type { BannedEmailRow, Env, PawnRow, UserRow, Variables } from './types';
import {
  requireString,
  validateEmail,
  validateOriginalImageUpload,
  validateProcessedImageUpload,
  validateLoginIdentifier,
  validatePassword,
  validatePawnPayload,
  validateUsername,
} from './validation';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5173',
      'https://pawnnexus.com',
      'https://www.pawnnexus.com',
      'https://pawnnexus.pages.dev',
      'https://pawnnexus-dev.pages.dev',
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

app.post('/register', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const email = validateEmail(body.email);
  const username = validateUsername(body.username);
  const password = validatePassword(body.password);

  if (await isEmailBanned(c.env.DB, email)) {
    throw new HTTPException(403, { message: 'This email cannot register an account' });
  }

  if (await getUserByEmail(c.env.DB, email)) {
    throw new HTTPException(409, { message: 'email is already registered' });
  }

  if (await getUserByUsername(c.env.DB, username)) {
    throw new HTTPException(409, { message: 'username is already registered' });
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await c.env.DB.prepare('INSERT INTO users (id, email, username, password_hash, role, status, email_verified_at) VALUES (?, ?, ?, ?, ?, ?, NULL)')
    .bind(id, email, username, passwordHash, 'user', 'active')
    .run();

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  if (!user) throw new HTTPException(500, { message: 'Unable to create user' });

  await createAndSendVerification(c.env, user, user.email, false);

  return c.json({ token: await signToken(c.env, authUserFromRow(user)), user: publicUser(user) }, 201);
});

app.post('/login', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const identifier = validateLoginIdentifier(body.identifier ?? body.email);
  const password = validatePassword(body.password);
  const user = await getUserByLogin(c.env.DB, identifier);

  if (!user || user.status !== 'active' || (await isEmailBanned(c.env.DB, user.email)) || !(await verifyPassword(password, user.password_hash))) {
    throw new HTTPException(401, { message: 'Invalid username, email, or password' });
  }

  return c.json({ token: await signToken(c.env, authUserFromRow(user)), user: publicUser(user) });
});

app.post('/verify-email', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const token = requireString(body.token, 'token', 500);
  const tokenHash = await hashToken(token);
  const row = await c.env.DB.prepare(
    `SELECT email_verification_tokens.*, users.status AS user_status
     FROM email_verification_tokens
     JOIN users ON users.id = email_verification_tokens.user_id
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`,
  )
    .bind(tokenHash)
    .first<{ id: string; user_id: string; email: string; user_status: string }>();

  if (!row || row.user_status !== 'active') {
    throw new HTTPException(400, { message: 'Verification link is invalid or expired' });
  }

  await c.env.DB.prepare(
    "UPDATE users SET email = ?, pending_email = NULL, email_verified_at = datetime('now') WHERE id = ?",
  )
    .bind(row.email, row.user_id)
    .run();
  await c.env.DB.prepare("UPDATE email_verification_tokens SET used_at = datetime('now') WHERE id = ?").bind(row.id).run();

  const user = await getUserById(c.env.DB, row.user_id);
  if (!user) throw new HTTPException(404, { message: 'User not found' });
  return c.json({ user: publicUser(user) });
});

app.post('/resend-verification', requireAuth, async (c) => {
  const current = c.get('user');
  const user = await getUserById(c.env.DB, current.id);
  if (!user) throw new HTTPException(404, { message: 'User not found' });

  if (user.email_verified_at) {
    return c.json({ ok: true, user: publicUser(user) });
  }

  await createAndSendVerification(c.env, user, user.pending_email ?? user.email, true);
  return c.json({ ok: true, user: publicUser(user) });
});

app.post('/change-email', requireAuth, async (c) => {
  const current = c.get('user');
  const user = await getUserById(c.env.DB, current.id);
  if (!user) throw new HTTPException(404, { message: 'User not found' });
  if (user.email_verified_at) throw new HTTPException(400, { message: 'Email is already verified' });

  const body = await c.req.json<Record<string, unknown>>();
  const email = validateEmail(body.email);
  if (await isEmailBanned(c.env.DB, email)) {
    throw new HTTPException(403, { message: 'This email cannot be used' });
  }

  const existing = await getUserByEmailOrPendingEmail(c.env.DB, email);
  if (existing && existing.id !== user.id) {
    throw new HTTPException(409, { message: 'email is already registered' });
  }

  await c.env.DB.prepare('UPDATE users SET email = ?, pending_email = NULL, email_verified_at = NULL WHERE id = ?')
    .bind(email, user.id)
    .run();
  const updated = await getUserById(c.env.DB, user.id);
  if (!updated) throw new HTTPException(500, { message: 'Unable to update email' });

  await createAndSendVerification(c.env, updated, email, false);
  return c.json({ user: publicUser(updated) });
});

app.post('/forgot-password', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  let email: string | null = null;

  try {
    email = validateEmail(body.email);
  } catch {
    return c.json({ ok: true });
  }

  const user = await getUserByEmail(c.env.DB, email);
  if (user && user.status === 'active' && !(await isEmailBanned(c.env.DB, user.email))) {
    const recent = await c.env.DB.prepare(
      "SELECT id FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL AND created_at > datetime('now', '-10 minutes') LIMIT 1",
    )
      .bind(user.id)
      .first<{ id: string }>();

    if (!recent) {
      const token = createSecureToken();
      await c.env.DB.prepare(
        "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+1 hour'))",
      )
        .bind(crypto.randomUUID(), user.id, await hashToken(token))
        .run();
      await sendPasswordResetEmail(c.env, user.email, token);
    }
  }

  return c.json({ ok: true });
});

app.post('/reset-password', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const token = requireString(body.token, 'token', 500);
  const password = validatePassword(body.password);
  const tokenHash = await hashToken(token);
  const row = await c.env.DB.prepare(
    `SELECT password_reset_tokens.*, users.status AS user_status
     FROM password_reset_tokens
     JOIN users ON users.id = password_reset_tokens.user_id
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`,
  )
    .bind(tokenHash)
    .first<{ id: string; user_id: string; user_status: string }>();

  if (!row || row.user_status !== 'active') {
    throw new HTTPException(400, { message: 'Reset link is invalid or expired' });
  }

  await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(await hashPassword(password), row.user_id)
    .run();
  await c.env.DB.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?").bind(row.id).run();

  return c.json({ ok: true });
});

app.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  const row = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first<UserRow>();
  if (!row) throw new HTTPException(404, { message: 'User not found' });
  return c.json({ user: publicUser(row) });
});

app.get('/me/pawns', requireAuth, async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(
    `SELECT pawns.*, users.username AS owner_username
     FROM pawns
     JOIN users ON users.id = pawns.user_id
     WHERE pawns.user_id = ?
     ORDER BY pawns.created_at DESC`,
  )
    .bind(user.id)
    .all<PawnRow>();

  const pawns = await decayPawns(c.env.DB, result.results);
  return c.json({ pawns: pawns.map(publicPawn) });
});

app.get('/pawns', async (c) => {
  const platform = c.req.query('platform');
  const vocation = c.req.query('vocation');
  const minLevel = Number(c.req.query('minLevel') ?? 0);
  const maxLevel = Number(c.req.query('maxLevel') ?? 999);
  const search = c.req.query('search')?.trim();
  const specialization = c.req.query('specialization')?.trim();
  const inclination = c.req.query('inclination')?.trim();

  const conditions = ['pawns.status = ?'];
  const values: (string | number)[] = ['approved'];

  if (platform) {
    if (platform === 'Nintendo Switch 2') {
      conditions.push('(pawns.platform = ? OR pawns.platform = ?)');
      values.push('Nintendo Switch 2', 'Nintendo Switch');
    } else {
      conditions.push('pawns.platform = ?');
      values.push(platform);
    }
  }

  if (vocation) {
    conditions.push('pawns.vocation = ?');
    values.push(vocation);
  }

  if (specialization) {
    conditions.push('pawns.specialization = ?');
    values.push(specialization);
  }

  if (inclination) {
    conditions.push('pawns.inclination = ?');
    values.push(inclination);
  }

  if (Number.isFinite(minLevel) && minLevel > 0) {
    conditions.push('pawns.level >= ?');
    values.push(minLevel);
  }

  if (Number.isFinite(maxLevel) && maxLevel < 999) {
    conditions.push('pawns.level <= ?');
    values.push(maxLevel);
  }

  if (search) {
    conditions.push('(pawns.pawn_name LIKE ? OR pawns.arisen_name LIKE ? OR users.username LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const result = await c.env.DB.prepare(
    `SELECT pawns.*, users.username AS owner_username
     FROM pawns
     JOIN users ON users.id = pawns.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY pawns.created_at DESC
     LIMIT 100`,
  )
    .bind(...values)
    .all<PawnRow>();

  const pawns = await decayPawns(c.env.DB, result.results);
  return c.json({ pawns: pawns.filter(isPubliclyActive).slice(0, 60).map(publicPawn) });
});

app.get('/pawns/:id', async (c) => {
  const pawn = await getPawnById(c.env.DB, c.req.param('id'));
  if (!pawn) {
    throw new HTTPException(404, { message: 'Pawn not found' });
  }

  const requester = await getOptionalUser(c);
  const canManage = requester ? canManagePawn(requester, pawn) : false;

  if ((pawn.status !== 'approved' || !isPubliclyActive(pawn)) && !canManage) {
    throw new HTTPException(404, { message: 'Pawn not found' });
  }

  return c.json({ pawn: publicPawn(pawn) });
});

app.post('/pawns', requireAuth, requireVerified, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<Record<string, unknown>>();
  const payload = validatePawnPayload(body);
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO pawns (
      id, user_id, pawn_name, arisen_name, gender, race, platform, vocation, level, inclination,
      skills, description, pawn_id, steam_url, switch_friend_id, psn_id, xbox_gamertag,
      weapon1, weapon2, head, body, legs, cloak, ring1, ring2,
      augment1, augment2, augment3, augment4, augment5, augment6, specialization,
      image_url, image_urls, thumbnail_url, status, activity_stars, last_refreshed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      id,
      user.id,
      payload.pawnName,
      payload.arisenName,
      payload.gender,
      payload.race,
      payload.platform,
      payload.vocation,
      payload.level,
      payload.inclination,
      payload.skills,
      payload.description,
      payload.pawnId,
      payload.steamUrl,
      payload.switchFriendId,
      payload.psnId,
      payload.xboxGamertag,
      payload.weapon1,
      payload.weapon2,
      payload.head,
      payload.body,
      payload.legs,
      payload.cloak,
      payload.ring1,
      payload.ring2,
      payload.augment1,
      payload.augment2,
      payload.augment3,
      payload.augment4,
      payload.augment5,
      payload.augment6,
      payload.specialization,
      payload.imageUrl,
      JSON.stringify(payload.images),
      payload.thumbnailUrl,
      'pending',
      3,
    )
    .run();

  const pawn = await getPawnById(c.env.DB, id);
  if (!pawn) throw new HTTPException(500, { message: 'Unable to create pawn' });
  return c.json({ pawn: publicPawn(pawn) }, 201);
});

app.put('/pawns/:id', requireAuth, requireVerified, async (c) => {
  const user = c.get('user');
  const pawn = await getPawnById(c.env.DB, c.req.param('id'));
  if (!pawn) throw new HTTPException(404, { message: 'Pawn not found' });
  if (!canManagePawn(user, pawn)) throw new HTTPException(403, { message: 'Not allowed' });

  const body = await c.req.json<Record<string, unknown>>();
  const payload = validatePawnPayload(body);
  const status = user.role === 'admin' ? pawn.status : 'pending';

  await c.env.DB.prepare(
    `UPDATE pawns
     SET pawn_name = ?, arisen_name = ?, gender = ?, race = ?, platform = ?, vocation = ?, level = ?,
         inclination = ?, skills = ?, description = ?, pawn_id = ?, steam_url = ?,
         switch_friend_id = ?, psn_id = ?, xbox_gamertag = ?, weapon1 = ?, weapon2 = ?,
         head = ?, body = ?, legs = ?, cloak = ?, ring1 = ?, ring2 = ?,
         augment1 = ?, augment2 = ?, augment3 = ?, augment4 = ?, augment5 = ?, augment6 = ?, specialization = ?,
         image_url = ?, image_urls = ?, thumbnail_url = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(
      payload.pawnName,
      payload.arisenName,
      payload.gender,
      payload.race,
      payload.platform,
      payload.vocation,
      payload.level,
      payload.inclination,
      payload.skills,
      payload.description,
      payload.pawnId,
      payload.steamUrl,
      payload.switchFriendId,
      payload.psnId,
      payload.xboxGamertag,
      payload.weapon1,
      payload.weapon2,
      payload.head,
      payload.body,
      payload.legs,
      payload.cloak,
      payload.ring1,
      payload.ring2,
      payload.augment1,
      payload.augment2,
      payload.augment3,
      payload.augment4,
      payload.augment5,
      payload.augment6,
      payload.specialization,
      payload.imageUrl,
      JSON.stringify(payload.images),
      payload.thumbnailUrl,
      status,
      pawn.id,
    )
    .run();

  const updated = await getPawnById(c.env.DB, pawn.id);
  if (!updated) throw new HTTPException(500, { message: 'Unable to update pawn' });
  return c.json({ pawn: publicPawn(updated) });
});

app.post('/pawns/:id/refresh', requireAuth, requireVerified, async (c) => {
  const user = c.get('user');
  const pawn = await getPawnById(c.env.DB, c.req.param('id'));
  if (!pawn) throw new HTTPException(404, { message: 'Pawn not found' });
  if (!canManagePawn(user, pawn)) throw new HTTPException(403, { message: 'Not allowed' });

  await c.env.DB.prepare(
    "UPDATE pawns SET activity_stars = 3, last_refreshed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
  )
    .bind(pawn.id)
    .run();

  const refreshed = await getPawnById(c.env.DB, pawn.id);
  if (!refreshed) throw new HTTPException(500, { message: 'Unable to refresh pawn' });
  return c.json({ pawn: publicPawn(refreshed) });
});

app.delete('/pawns/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const pawn = await getPawnById(c.env.DB, c.req.param('id'));
  if (!pawn) throw new HTTPException(404, { message: 'Pawn not found' });
  if (!canManagePawn(user, pawn) && user.role !== 'moderator') throw new HTTPException(403, { message: 'Not allowed' });

  await c.env.DB.prepare('DELETE FROM pawns WHERE id = ?').bind(pawn.id).run();
  return c.json({ ok: true });
});

app.post("/upload", requireAuth, requireVerified, async (c) => {
  const form = await c.req.formData();
  const count = Number(form.get("count") ?? 0);

  if (!Number.isInteger(count) || count < 1 || count > 5) {
    throw new HTTPException(400, { message: "Upload between 1 and 5 images" });
  }

  const images = [];

  for (let index = 0; index < count; index += 1) {
    const original = form.get("original_" + index);
    const image = form.get("image_" + index);
    const thumb = form.get("thumb_" + index);

    if (!(original instanceof File) || !(image instanceof File) || !(thumb instanceof File)) {
      throw new HTTPException(400, { message: "Each upload must include original, image, and thumbnail files" });
    }

    await validateOriginalImageUpload(original);
    const imageMeta = await validateProcessedImageUpload(image, "image");
    const thumbMeta = await validateProcessedImageUpload(thumb, "thumbnail");

    const id = crypto.randomUUID();
    const baseKey = "pawns/" + id;
    const imageKey = baseKey + "/image." + imageMeta.extension;
    const thumbKey = baseKey + "/thumb." + thumbMeta.extension;

    await c.env.IMAGES.put(imageKey, image.stream(), {
      httpMetadata: { contentType: imageMeta.contentType },
    });
    await c.env.IMAGES.put(thumbKey, thumb.stream(), {
      httpMetadata: { contentType: thumbMeta.contentType },
    });

    images.push({
      imageUrl: publicImageUrl(c.req.url, c.env.PUBLIC_IMAGE_BASE_URL, imageKey),
      thumbUrl: publicImageUrl(c.req.url, c.env.PUBLIC_IMAGE_BASE_URL, thumbKey),
      sortOrder: index,
    });
  }

  return c.json({ images, imageUrl: images[0].imageUrl, thumbnailUrl: images[0].thumbUrl }, 201);
});

app.get('/images/*', async (c) => {
  const key = c.req.path.replace(/^\/images\//, '');
  if (!key || key.includes('..')) {
    throw new HTTPException(400, { message: 'Invalid image path' });
  }

  const object = await c.env.IMAGES.get(key);
  if (!object) {
    throw new HTTPException(404, { message: 'Image not found' });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

app.get('/admin/stats', requireAuth, requireAdmin, async (c) => {
  const accounts = await c.env.DB.prepare('SELECT COUNT(*) AS count FROM users').first<{ count: number }>();
  const activeAccounts = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").first<{ count: number }>();
  const pendingPawns = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM pawns WHERE status = 'pending'").first<{ count: number }>();
  const approvedPawns = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM pawns WHERE status = 'approved'").first<{ count: number }>();
  const bannedEmails = await c.env.DB.prepare('SELECT COUNT(*) AS count FROM banned_emails').first<{ count: number }>();

  return c.json({
    stats: {
      accounts: accounts?.count ?? 0,
      activeAccounts: activeAccounts?.count ?? 0,
      pendingPawns: pendingPawns?.count ?? 0,
      approvedPawns: approvedPawns?.count ?? 0,
      bannedEmails: bannedEmails?.count ?? 0,
    },
  });
});

app.get('/admin/users', requireAuth, requireAdmin, async (c) => {
  const search = c.req.query('search')?.trim();
  const page = Math.max(1, Number(c.req.query('page') ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(c.req.query('pageSize') ?? 20)));
  const offset = (page - 1) * pageSize;
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (search) {
    conditions.push('(username LIKE ? OR email LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await c.env.DB.prepare(`SELECT COUNT(*) AS count FROM users ${where}`).bind(...values).first<{ count: number }>();
  const result = await c.env.DB.prepare(
    `SELECT id, email, username, role, status, email_verified_at, pending_email, created_at
     FROM users
     ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...values, pageSize, offset)
    .all<UserRow>();

  return c.json({
    users: result.results.map(publicUser),
    page,
    pageSize,
    total: count?.count ?? 0,
  });
});

app.post('/admin/users/:id/role', requireAuth, requireAdmin, async (c) => {
  const current = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json<Record<string, unknown>>();
  const role = requireString(body.role, 'role', 20);

  if (role !== 'user' && role !== 'moderator' && role !== 'admin') {
    throw new HTTPException(400, { message: 'role is invalid' });
  }

  if (current.id === id && role !== 'admin') {
    throw new HTTPException(400, { message: 'Admins cannot demote themselves' });
  }

  const target = await getUserById(c.env.DB, id);
  if (!target) throw new HTTPException(404, { message: 'User not found' });

  await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
  const updated = await getUserById(c.env.DB, id);
  if (!updated) throw new HTTPException(500, { message: 'Unable to update user role' });

  return c.json({ user: publicUser(updated) });
});

app.delete('/admin/users/:id', requireAuth, requireAdmin, async (c) => {
  const current = c.get('user');
  const id = c.req.param('id');

  if (current.id === id) {
    throw new HTTPException(400, { message: 'Admins cannot delete their own account' });
  }

  await c.env.DB.prepare('DELETE FROM pawns WHERE user_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

app.get('/admin/banned-emails', requireAuth, requireAdmin, async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM banned_emails ORDER BY created_at DESC LIMIT 200').all<BannedEmailRow>();
  return c.json({ bannedEmails: result.results.map((row) => ({ email: row.email, reason: row.reason, createdAt: row.created_at })) });
});

app.post('/admin/ban-email', requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const email = validateEmail(body.email);
  const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 300) : null;

  await c.env.DB.prepare('INSERT OR REPLACE INTO banned_emails (email, reason, created_at) VALUES (?, ?, datetime(\'now\'))')
    .bind(email, reason)
    .run();
  await c.env.DB.prepare("UPDATE users SET status = 'banned' WHERE lower(email) = lower(?)").bind(email).run();

  return c.json({ ok: true }, 201);
});

app.post('/admin/unban-email', requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const email = validateEmail(body.email);

  await c.env.DB.prepare('DELETE FROM banned_emails WHERE lower(email) = lower(?)').bind(email).run();
  await c.env.DB.prepare("UPDATE users SET status = 'active' WHERE lower(email) = lower(?)").bind(email).run();

  return c.json({ ok: true });
});

app.get('/admin/pending', requireAuth, requireModerator, async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT pawns.*, users.username AS owner_username
     FROM pawns
     JOIN users ON users.id = pawns.user_id
     WHERE pawns.status = ?
     ORDER BY pawns.created_at ASC`,
  )
    .bind('pending')
    .all<PawnRow>();

  const pawns = await decayPawns(c.env.DB, result.results);
  return c.json({ pawns: pawns.map(publicPawn) });
});

app.post('/admin/approve/:id', requireAuth, requireModerator, async (c) => {
  const pawn = await updatePawnStatus(c.env.DB, c.req.param('id'), 'approved');
  return c.json({ pawn: publicPawn(pawn) });
});

app.post('/admin/reject/:id', requireAuth, requireModerator, async (c) => {
  const pawn = await updatePawnStatus(c.env.DB, c.req.param('id'), 'rejected');
  return c.json({ pawn: publicPawn(pawn) });
});

function publicImageUrl(requestUrl: string, configuredBaseUrl: string, key: string) {
  if (configuredBaseUrl && !configuredBaseUrl.includes("example.com")) {
    const baseUrl = configuredBaseUrl.endsWith("/") ? configuredBaseUrl.slice(0, -1) : configuredBaseUrl;
    return baseUrl + "/" + key;
  }

  const url = new URL(requestUrl);
  return url.origin + "/images/" + key;
}

async function getOptionalUser(c: { req: { header: (name: string) => string | undefined }; env: Env }) {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return null;

  try {
    const payload = await verifyToken(c.env, token);
    const user = await getUserById(c.env.DB, payload.id);
    if (!user || user.status !== 'active' || (await isEmailBanned(c.env.DB, user.email))) return null;
    return authUserFromRow(user);
  } catch {
    return null;
  }
}


function authUserFromRow(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.email_verified_at ?? null,
    pendingEmail: user.pending_email ?? null,
  };
}

async function createAndSendVerification(env: Env, user: UserRow, email: string, respectCooldown: boolean) {
  if (respectCooldown) {
    const recent = await env.DB.prepare(
      "SELECT id FROM email_verification_tokens WHERE user_id = ? AND lower(email) = lower(?) AND used_at IS NULL AND created_at > datetime('now', '-5 minutes') LIMIT 1",
    )
      .bind(user.id, email)
      .first<{ id: string }>();

    if (recent) return;
  }

  const token = createSecureToken();
  await env.DB.prepare(
    "INSERT INTO email_verification_tokens (id, user_id, email, token_hash, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+24 hours'))",
  )
    .bind(crypto.randomUUID(), user.id, email, await hashToken(token))
    .run();

  await sendVerificationEmail(env, email, token);
}

async function decayPawns(db: D1Database, pawns: PawnRow[]) {
  return Promise.all(pawns.map((pawn) => decayPawnActivity(db, pawn)));
}

function isPubliclyActive(pawn: PawnRow) {
  return pawn.activity_stars > 1;
}

async function updatePawnStatus(db: D1Database, id: string, status: PawnRow['status']) {
  await db.prepare("UPDATE pawns SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, id).run();
  const pawn = await getPawnById(db, id);
  if (!pawn) throw new HTTPException(404, { message: 'Pawn not found' });
  return pawn;
}

export default app;
