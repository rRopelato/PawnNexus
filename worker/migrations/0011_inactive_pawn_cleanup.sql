ALTER TABLE pawns ADD COLUMN inactive_since TEXT;
CREATE INDEX IF NOT EXISTS idx_pawns_inactive_since ON pawns(inactive_since);
