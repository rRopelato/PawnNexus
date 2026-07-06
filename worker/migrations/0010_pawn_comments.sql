CREATE TABLE IF NOT EXISTS pawn_comments (
  id TEXT PRIMARY KEY,
  pawn_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pawn_id) REFERENCES pawns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pawn_comments_pawn_id ON pawn_comments(pawn_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pawn_comments_user_id ON pawn_comments(user_id);
