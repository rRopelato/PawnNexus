-- Low-risk query optimization indexes from docs/database-query-audit.md.
-- Rollback:
-- DROP INDEX IF EXISTS idx_users_email_lower;
-- DROP INDEX IF EXISTS idx_users_pending_email_lower;
-- DROP INDEX IF EXISTS idx_banned_emails_email_lower;
-- DROP INDEX IF EXISTS idx_pawns_user_status_created_at;

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email));
CREATE INDEX IF NOT EXISTS idx_users_pending_email_lower ON users(lower(pending_email));
CREATE INDEX IF NOT EXISTS idx_banned_emails_email_lower ON banned_emails(lower(email));
CREATE INDEX IF NOT EXISTS idx_pawns_user_status_created_at ON pawns(user_id, status, created_at DESC);
