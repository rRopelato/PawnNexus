import type { AuthUser, PawnImage, PawnRow, UserRow } from './types';

export function publicUser(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    emailVerifiedAt: row.email_verified_at ?? null,
    pendingEmail: row.pending_email ?? null,
    createdAt: row.created_at,
  };
}

export const pawnStatsSelect = `
  (SELECT COUNT(*) FROM pawn_likes WHERE pawn_likes.pawn_id = pawns.id) AS likes_count,
  (SELECT COUNT(*) FROM pawn_favorites WHERE pawn_favorites.pawn_id = pawns.id) AS favorites_count
`;

export function pawnViewerStatsSelect(viewerId: string | null) {
  if (!viewerId) {
    return pawnStatsSelect + ', 0 AS user_liked, 0 AS user_favorited';
  }

  return pawnStatsSelect + `,
  EXISTS(SELECT 1 FROM pawn_likes WHERE pawn_likes.pawn_id = pawns.id AND pawn_likes.user_id = ?) AS user_liked,
  EXISTS(SELECT 1 FROM pawn_favorites WHERE pawn_favorites.pawn_id = pawns.id AND pawn_favorites.user_id = ?) AS user_favorited`;
}

export function publicPawn(row: PawnRow) {
  const images = parseImages(row.image_urls, row.image_url);
  const weaponSkills = parseSkills(row.skills).slice(0, 4);

  return {
    id: row.id,
    userId: row.user_id,
    pawnName: row.pawn_name,
    arisenName: row.arisen_name,
    gender: row.gender,
    race: row.race,
    platform: normalizePlatform(row.platform),
    vocation: row.vocation,
    level: row.level,
    inclination: row.inclination,
    skills: weaponSkills,
    weaponSkills,
    description: row.description,
    pawnId: row.pawn_id,
    steamUrl: row.steam_url,
    switchFriendId: row.switch_friend_id,
    psnId: row.psn_id,
    xboxGamertag: row.xbox_gamertag,
    weapon1: row.weapon1,
    weapon2: row.weapon2,
    head: row.head,
    body: row.body,
    legs: row.legs,
    cloak: row.cloak,
    ring1: row.ring1,
    ring2: row.ring2,
    augment1: row.augment1,
    augment2: row.augment2,
    augment3: row.augment3,
    augment4: row.augment4,
    augment5: row.augment5,
    augment6: row.augment6,
    specialization: row.specialization,
    imageUrl: images[0]?.imageUrl ?? row.image_url,
    thumbnailUrl: row.thumbnail_url ?? images[0]?.thumbUrl ?? row.image_url,
    images,
    status: row.status,
    activityStars: row.activity_stars,
    lastRefreshedAt: row.last_refreshed_at,
    inactiveSince: row.inactive_since ?? null,
    ownerUsername: row.owner_username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likesCount: Number(row.likes_count ?? 0),
    favoritesCount: Number(row.favorites_count ?? 0),
    userLiked: Boolean(row.user_liked),
    userFavorited: Boolean(row.user_favorited),
  };
}

export async function getUserById(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function getUserByEmail(db: D1Database, email: string) {
  return db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').bind(email).first<UserRow>();
}

export async function getUserByEmailOrPendingEmail(db: D1Database, email: string) {
  return db
    .prepare('SELECT * FROM users WHERE lower(email) = lower(?) OR lower(pending_email) = lower(?)')
    .bind(email, email)
    .first<UserRow>();
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

export async function getPawnById(db: D1Database, id: string, viewerId: string | null = null) {
  const viewerValues = viewerId ? [viewerId, viewerId] : [];
  const pawn = await db
    .prepare(
      `SELECT pawns.*, users.username AS owner_username, ${pawnViewerStatsSelect(viewerId)}
       FROM pawns
       JOIN users ON users.id = pawns.user_id
       WHERE pawns.id = ?`,
    )
    .bind(...viewerValues, id)
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

  const reachedInactive = nextStars <= 1;
  await db.prepare(
    reachedInactive
      ? "UPDATE pawns SET activity_stars = ?, inactive_since = COALESCE(inactive_since, datetime('now')), updated_at = datetime('now') WHERE id = ?"
      : "UPDATE pawns SET activity_stars = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(nextStars, pawn.id)
    .run();

  return {
    ...pawn,
    activity_stars: nextStars,
    inactive_since: reachedInactive ? pawn.inactive_since ?? new Date().toISOString() : pawn.inactive_since,
    updated_at: new Date().toISOString(),
  };
}

export function canManagePawn(user: AuthUser, pawn: PawnRow) {
  return user.role === 'admin' || user.id === pawn.user_id;
}

export function normalizePlatform(platform: string) {
  return platform === 'Nintendo Switch' ? 'Nintendo Switch 2' : platform;
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
