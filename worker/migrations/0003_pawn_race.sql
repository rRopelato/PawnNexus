ALTER TABLE pawns ADD COLUMN race TEXT NOT NULL DEFAULT 'Human' CHECK (race IN ('Human', 'Beastren'));
