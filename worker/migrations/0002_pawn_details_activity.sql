ALTER TABLE pawns ADD COLUMN gender TEXT NOT NULL DEFAULT 'Unspecified' CHECK (gender IN ('Female', 'Male', 'Unspecified'));
ALTER TABLE pawns ADD COLUMN skills TEXT NOT NULL DEFAULT '';
ALTER TABLE pawns ADD COLUMN steam_url TEXT;
ALTER TABLE pawns ADD COLUMN switch_friend_id TEXT;
ALTER TABLE pawns ADD COLUMN psn_id TEXT;
ALTER TABLE pawns ADD COLUMN xbox_gamertag TEXT;
ALTER TABLE pawns ADD COLUMN activity_stars INTEGER NOT NULL DEFAULT 3 CHECK (activity_stars BETWEEN 1 AND 3);
ALTER TABLE pawns ADD COLUMN last_refreshed_at TEXT NOT NULL DEFAULT '1970-01-01 00:00:00';
UPDATE pawns SET last_refreshed_at = COALESCE(updated_at, created_at, datetime('now'));

CREATE INDEX IF NOT EXISTS idx_pawns_public_activity ON pawns(status, activity_stars, created_at DESC);
