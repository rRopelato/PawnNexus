export type Platform = 'Steam' | 'Nintendo Switch 2' | 'PlayStation' | 'Xbox';
export type PawnGender = 'Female' | 'Male' | 'Unspecified';
export type PawnRace = 'Human' | 'Beastren';
export type Vocation =
  | 'Fighter'
  | 'Archer'
  | 'Mage'
  | 'Thief'
  | 'Warrior'
  | 'Sorcerer';
export type PawnStatus = 'pending' | 'approved' | 'rejected';

export type User = {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'banned';
  emailVerifiedAt: string | null;
  pendingEmail: string | null;
  createdAt: string;
};

export type AdminStats = {
  accounts: number;
  activeAccounts: number;
  pendingPawns: number;
  approvedPawns: number;
  bannedEmails: number;
};

export type BannedEmail = {
  email: string;
  reason: string | null;
  createdAt: string;
};

export type PawnImage = {
  imageUrl: string;
  thumbUrl: string;
  sortOrder: number;
};

export type Pawn = {
  id: string;
  userId: string;
  pawnName: string;
  arisenName: string;
  gender: PawnGender;
  race: PawnRace;
  platform: Platform;
  vocation: Vocation;
  level: number;
  inclination: string;
  skills: string[];
  weaponSkills: string[];
  description: string;
  pawnId: string;
  steamUrl: string | null;
  switchFriendId: string | null;
  psnId: string | null;
  xboxGamertag: string | null;
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
  imageUrl: string;
  thumbnailUrl: string;
  images: PawnImage[];
  status: PawnStatus;
  activityStars: number;
  lastRefreshedAt: string;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
};

export type PawnFilters = {
  platform?: string;
  vocation?: string;
  minLevel?: string;
  maxLevel?: string;
  search?: string;
  specialization?: string;
  inclination?: string;
};

export type AdminUsersResult = {
  users: User[];
  page: number;
  pageSize: number;
  total: number;
};
