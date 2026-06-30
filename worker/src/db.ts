import type { AuthUser, PawnImage, PawnRow, UserRow } from './types';

export function publicUser(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function publicPawn(row: PawnRow) {
  const images = parseImages(row.image_urls, row.image_url);

  return {
    id: row.id,
    userId: row.user_id,
    pawnName: row.pawn_name,
    arisenName: row.arisen_name,
    gender: row.gender,
    race: row.race,
    platform: row.platform,
    vocation: row.vocation,
    level: row.level,
    inclination: row.inclination,
    skills: parseSkills(row.skills),
    description: row.description,
    pawnId: row.pawn_id,
    steamUrl: row.steam_url,
    switchFriendId: row.switch_friend_id,
    psnId: row.psn_id,
    xboxGamertag: row.xbox_gamertag,
    imageUrl: images[0]?.imageUrl ?? row.image_url,
    thumbnailUrl: row.thumbnail_url ?? images[0]?.thumbUrl ?? row.image_url,
    images,
    status: row.status,
    activityStars: row.activity_stars,
    lastRefreshedAt: row.last_refreshed_at,
    ownerUsername: row.owner_username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserById(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function getUserByEmail(db: D1Database, email: string) {
  return db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').bind(email).first<UserRow>();
}

export async function getUserByUsername(db: D1Database, username: string) {
  return db.prepare('SELECT * FROM users WHERE lower(username) = lower(?)').bind(username).first<UserRow>();
}

export async function getUserByLogin(db: D1Database, identifier: string) {
  return identifier.includes('@') ? getUserByEmail(db, identifier) : getUserByUsername(db, identifier);
}

export async function isEmailBanned(db: D1Database, email: string) {
  const row = await db.prepare('SELECT email FROM banned_emails WHERE lower(email) = lower(?)').bind(email).first<{ email: string }>();
  return Boolean(row);
}

export async function getPawnById(db: D1Database, id: string) {
  const pawn = await db
    .prepare(
      `SELECT pawns.*, users.username AS owner_username
       FROM pawns
       JOIN users ON users.id = pawns.user_id
       WHERE pawns.id = ?`,
    )
    .bind(id)
    .first<PawnRow>();

  return pawn ? decayPawnActivity(db, pawn) : null;
}

export async function decayPawnActivity(db: D1Database, pawn: PawnRow) {
  const refreshedAt = Date.parse(`${pawn.last_refreshed_at}Z`);
  if (!Number.isFinite(refreshedAt)) return pawn;

  const weeksSinceRefresh = Math.floor((Date.now() - refreshedAt) / (7 * 24 * 60 * 60 * 1000));
  const nextStars = Math.max(1, 3 - weeksSinceRefresh);

  if (nextStars >= pawn.activity_stars) {
    return pawn;
  }

  await db.prepare("UPDATE pawns SET activity_stars = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(nextStars, pawn.id)
    .run();

  return {
    ...pawn,
    activity_stars: nextStars,
    updated_at: new Date().toISOString(),
  };
}

export function canManagePawn(user: AuthUser, pawn: PawnRow) {
  return user.role === 'admin' || user.id === pawn.user_id;
}

function parseImages(value: string, fallbackUrl: string): PawnImage[] {
  try {
    const images = JSON.parse(value) as PawnImage[];
    if (Array.isArray(images) && images.every(isPawnImage)) {
      return images.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  } catch {
    // Fall back to legacy single-image rows.
  }

  return fallbackUrl ? [{ imageUrl: fallbackUrl, thumbUrl: fallbackUrl, sortOrder: 0 }] : [];
}

function isPawnImage(value: unknown): value is PawnImage {
  if (!value || typeof value !== 'object') return false;
  const image = value as PawnImage;
  return typeof image.imageUrl === 'string' && typeof image.thumbUrl === 'string' && Number.isInteger(image.sortOrder);
}

function parseSkills(value: string) {
  return value
    .split('\n')
    .map((skill) => skill.trim())
    .filter(Boolean);
}
