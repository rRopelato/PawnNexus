import { HTTPException } from 'hono/http-exception';
import type { PawnImage } from './types';

const platforms = new Set(['Steam', 'Nintendo Switch', 'PlayStation', 'Xbox']);
const vocations = new Set(['Fighter', 'Archer', 'Mage', 'Thief', 'Warrior', 'Sorcerer']);
const inclinations = new Set(['Kindhearted', 'Calm', 'Straightforward', 'Simple']);
const genders = new Set(['Female', 'Male', 'Unspecified']);
const races = new Set(['Human', 'Beastren']);
const maxPawnImages = 5;
const maxUploadBytes = 5 * 1024 * 1024;

export function requireString(value: unknown, name: string, maxLength = 160) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HTTPException(400, { message: `${name} is required` });
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HTTPException(400, { message: `${name} is too long` });
  }

  return trimmed;
}

function optionalString(value: unknown, name: string, maxLength = 160) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new HTTPException(400, { message: `${name} is invalid` });

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) throw new HTTPException(400, { message: `${name} is too long` });
  return trimmed;
}

export function validateEmail(value: unknown) {
  const email = requireString(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HTTPException(400, { message: 'email is invalid' });
  }
  return email;
}

export function validateUsername(value: unknown) {
  const username = requireString(value, 'username', 24);
  if (username.length < 3) {
    throw new HTTPException(400, { message: 'username must be at least 3 characters' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new HTTPException(400, { message: 'username may only contain letters, numbers, and underscores' });
  }
  return username;
}

export function validateLoginIdentifier(value: unknown) {
  const identifier = requireString(value, 'email or username', 254);
  return identifier.includes('@') ? validateEmail(identifier) : validateUsername(identifier);
}

export function validatePassword(value: unknown) {
  const password = requireString(value, 'password', 128);
  if (password.length < 8) {
    throw new HTTPException(400, { message: 'password must be at least 8 characters' });
  }
  return password;
}

export async function validateOriginalImageUpload(file: File) {
  if (file.size === 0) throw new HTTPException(400, { message: 'image is empty' });
  if (file.size > maxUploadBytes) {
    throw new HTTPException(400, { message: 'each image must be 5MB or less' });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const realType = detectImageType(bytes);
  if (!realType || !['image/jpeg', 'image/png', 'image/webp'].includes(realType) || !hasValidImageContainer(bytes, realType)) {
    throw new HTTPException(400, { message: 'file must be a valid JPG, JPEG, PNG, or WebP image' });
  }

  if (file.type && file.type !== realType) {
    throw new HTTPException(400, { message: 'file type does not match its real image content' });
  }

  return realType;
}

export async function validateProcessedImageUpload(file: File, name: string) {
  if (file.size === 0) throw new HTTPException(400, { message: name + " is empty" });
  if (file.size > maxUploadBytes) throw new HTTPException(400, { message: name + " is too large" });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const realType = detectImageType(bytes);

  if (!realType || !["image/webp", "image/jpeg"].includes(realType) || !hasValidImageContainer(bytes, realType)) {
    throw new HTTPException(400, { message: name + " must be a valid WebP or JPEG image" });
  }

  if (file.type && file.type !== realType) {
    throw new HTTPException(400, { message: name + " type does not match its real image content" });
  }

  return {
    contentType: realType,
    extension: realType === "image/webp" ? "webp" : "jpg",
  };
}

export function validatePawnImages(value: unknown) {
  if (!Array.isArray(value)) throw new HTTPException(400, { message: 'images is required' });
  if (value.length < 1) throw new HTTPException(400, { message: 'at least one image is required' });
  if (value.length > maxPawnImages) throw new HTTPException(400, { message: 'a pawn can have at most 5 images' });

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') throw new HTTPException(400, { message: 'images is invalid' });
    const image = item as Partial<PawnImage>;
    const imageUrl = requireString(image.imageUrl, 'imageUrl', 500);
    const thumbUrl = requireString(image.thumbUrl, 'thumbUrl', 500);
    const sortOrder = Number(image.sortOrder ?? index);
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder >= maxPawnImages) {
      throw new HTTPException(400, { message: 'image sortOrder is invalid' });
    }
    return { imageUrl, thumbUrl, sortOrder } satisfies PawnImage;
  });
}

export function validatePawnPayload(body: Record<string, unknown>) {
  const platform = requireString(body.platform, 'platform');
  const vocation = requireString(body.vocation, 'vocation');
  const inclination = requireString(body.inclination, 'inclination');
  const gender = requireString(body.gender ?? 'Unspecified', 'gender');
  const race = requireString(body.race ?? 'Human', 'race');
  const level = Number(body.level);
  const steamUrl = optionalString(body.steamUrl, 'steamUrl', 300);
  const switchFriendId = optionalString(body.switchFriendId, 'switchFriendId', 80);
  const psnId = optionalString(body.psnId, 'psnId', 80);
  const xboxGamertag = optionalString(body.xboxGamertag, 'xboxGamertag', 80);

  if (!platforms.has(platform)) throw new HTTPException(400, { message: 'platform is invalid' });
  if (!vocations.has(vocation)) throw new HTTPException(400, { message: 'vocation is invalid' });
  if (!inclinations.has(inclination)) throw new HTTPException(400, { message: 'inclination is invalid' });
  if (!genders.has(gender)) throw new HTTPException(400, { message: 'gender is invalid' });
  if (!races.has(race)) throw new HTTPException(400, { message: 'race is invalid' });
  if (!Number.isInteger(level) || level < 1 || level > 999) {
    throw new HTTPException(400, { message: 'level is invalid' });
  }

  if (steamUrl && !/^https:\/\/(?:steamcommunity\.com|s\.team)\//i.test(steamUrl)) {
    throw new HTTPException(400, { message: 'steamUrl must be a Steam profile URL' });
  }

  if (platform === 'Steam' && !steamUrl) throw new HTTPException(400, { message: 'steamUrl is required for Steam pawns' });
  if (platform === 'Nintendo Switch' && !switchFriendId) {
    throw new HTTPException(400, { message: 'switchFriendId is required for Nintendo Switch pawns' });
  }
  if (platform === 'PlayStation' && !psnId) throw new HTTPException(400, { message: 'psnId is required for PlayStation pawns' });
  if (platform === 'Xbox' && !xboxGamertag) throw new HTTPException(400, { message: 'xboxGamertag is required for Xbox pawns' });

  const images = validatePawnImages(body.images);
  const skills = normalizeSkills(body.skills);

  return {
    pawnName: requireString(body.pawnName, 'pawnName', 80),
    arisenName: requireString(body.arisenName, 'arisenName', 80),
    gender,
    race,
    platform,
    vocation,
    level,
    inclination,
    skills,
    description: requireString(body.description, 'description', 3000),
    pawnId: requireString(body.pawnId, 'pawnId', 80),
    steamUrl: platform === 'Steam' ? steamUrl : null,
    switchFriendId: platform === 'Nintendo Switch' ? switchFriendId : null,
    psnId: platform === 'PlayStation' ? psnId : null,
    xboxGamertag: platform === 'Xbox' ? xboxGamertag : null,
    images,
    imageUrl: images[0].imageUrl,
    thumbnailUrl: images[0].thumbUrl,
  };
}

function normalizeSkills(value: unknown) {
  const source = Array.isArray(value) ? value.join('\n') : value;
  const skills = requireString(source, 'skills', 1200)
    .split('\n')
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (skills.length === 0) throw new HTTPException(400, { message: 'skills is required' });
  if (skills.length > 12) throw new HTTPException(400, { message: 'skills must include 12 entries or fewer' });

  return skills.join('\n');
}

function detectImageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}

function hasValidImageContainer(bytes: Uint8Array, type: string) {
  if (type === 'image/jpeg') {
    return bytes.length > 4 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  }

  if (type === 'image/png') {
    const pngEnd = [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
    return bytes.length >= pngEnd.length && pngEnd.every((byte, index) => bytes[bytes.length - pngEnd.length + index] === byte);
  }

  if (type === 'image/webp') {
    if (bytes.length < 16) return false;
    const riffSize = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
    return riffSize + 8 <= bytes.length;
  }

  return false;
}
