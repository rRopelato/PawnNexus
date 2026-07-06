CREATE TABLE IF NOT EXISTS pawn_likes (
  pawn_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (pawn_id, user_id),
  FOREIGN KEY (pawn_id) REFERENCES pawns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pawn_likes_pawn_id ON pawn_likes(pawn_id);
CREATE INDEX IF NOT EXISTS idx_pawn_likes_user_id ON pawn_likes(user_id);

CREATE TABLE IF NOT EXISTS pawn_favorites (
  pawn_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (pawn_id, user_id),
  FOREIGN KEY (pawn_id) REFERENCES pawns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pawn_favorites_pawn_id ON pawn_favorites(pawn_id);
CREATE INDEX IF NOT EXISTS idx_pawn_favorites_user_id ON pawn_favorites(user_id);
