CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pawns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pawn_name TEXT NOT NULL,
  arisen_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  vocation TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level > 0),
  inclination TEXT NOT NULL,
  description TEXT NOT NULL,
  pawn_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pawns_status_created_at ON pawns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pawns_user_id ON pawns(user_id);
CREATE INDEX IF NOT EXISTS idx_pawns_filters ON pawns(platform, vocation, level);
