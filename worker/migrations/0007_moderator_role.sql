PRAGMA foreign_keys = off;

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  username TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned'))
);

INSERT INTO users_new (id, email, password_hash, role, created_at, username, status)
SELECT id, email, password_hash, role, created_at, username, status
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(lower(username));
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

PRAGMA foreign_keys = on;
