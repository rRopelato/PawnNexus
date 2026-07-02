export type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  PUBLIC_IMAGE_BASE_URL: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  APP_BASE_URL: string;
};

export type Role = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'banned';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: UserStatus;
  emailVerifiedAt: string | null;
  pendingEmail: string | null;
};

export type Variables = {
  user: AuthUser;
};

export type UserRow = {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: Role;
  status: UserStatus;
  email_verified_at: string | null;
  pending_email: string | null;
  created_at: string;
};

export type BannedEmailRow = {
  email: string;
  reason: string | null;
  created_at: string;
};

export type PawnImage = {
  imageUrl: string;
  thumbUrl: string;
  sortOrder: number;
};

export type PawnRow = {
  id: string;
  user_id: string;
  pawn_name: string;
  arisen_name: string;
  gender: 'Female' | 'Male' | 'Unspecified';
  race: 'Human' | 'Beastren';
  platform: string;
  vocation: string;
  level: number;
  inclination: string;
  skills: string;
  description: string;
  pawn_id: string;
  steam_url: string | null;
  switch_friend_id: string | null;
  psn_id: string | null;
  xbox_gamertag: string | null;
  weapon1: string | null;
  weapon2: string | null;
  head: string | null;
  body: string | null;
  legs: string | null;
  cloak: string | null;
  ring1: string | null;
  ring2: string | null;
  augment1: string | null;
  augment2: string | null;
  augment3: string | null;
  augment4: string | null;
  augment5: string | null;
  augment6: string | null;
  specialization: string | null;
  image_url: string;
  image_urls: string;
  thumbnail_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  activity_stars: number;
  last_refreshed_at: string;
  owner_username: string;
  created_at: string;
  updated_at: string;
};
