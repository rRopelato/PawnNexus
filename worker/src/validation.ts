import { HTTPException } from 'hono/http-exception';

const platforms = new Set(['Steam', 'Nintendo Switch', 'PlayStation', 'Xbox']);
const vocations = new Set(['Fighter', 'Archer', 'Mage', 'Thief', 'Warrior', 'Sorcerer']);
const inclinations = new Set(['Kindhearted', 'Calm', 'Straightforward', 'Simple']);
const genders = new Set(['Female', 'Male', 'Unspecified']);
const races = new Set(['Human', 'Beastren']);
const allowedImageTypes = new Set(['image/jpeg', 'image/png']);

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

export function validateImageUpload(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new HTTPException(400, { message: 'file must be a JPG, JPEG, or PNG image' });
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['jpg', 'jpeg', 'png'].includes(extension)) {
    throw new HTTPException(400, { message: 'file extension must be jpg, jpeg, or png' });
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new HTTPException(400, { message: 'file must be 5MB or less' });
  }

  return extension === 'jpeg' ? 'jpg' : extension;
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
    imageUrl: requireString(body.imageUrl, 'imageUrl', 500),
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
