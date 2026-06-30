export type Platform = 'Steam' | 'Nintendo Switch' | 'PlayStation' | 'Xbox';
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
  role: 'user' | 'admin';
  status: 'active' | 'banned';
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
  description: string;
  pawnId: string;
  steamUrl: string | null;
  switchFriendId: string | null;
  psnId: string | null;
  xboxGamertag: string | null;
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
};
