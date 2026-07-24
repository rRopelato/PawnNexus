import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sqlite = spawnSync('sqlite3', ['--version'], { encoding: 'utf8' });
if (sqlite.status !== 0) {
  console.error('sqlite3 is required for query optimization validation.');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'pawnnexus-query-test-'));
const db = join(dir, 'audit.sqlite');

try {
  const migrations = readdirSync('worker/migrations').filter((file) => file.endsWith('.sql')).sort();
  for (const migration of migrations) {
    execFileSync('sqlite3', [db], { input: readFileSync(join('worker/migrations', migration)), stdio: ['pipe', 'pipe', 'pipe'] });
  }

  assertPlanUses("SELECT * FROM users WHERE lower(email) = lower('test@example.com')", 'idx_users_email_lower', 'case-insensitive user email lookup');
  assertPlanUses("SELECT * FROM users WHERE lower(pending_email) = lower('test@example.com')", 'idx_users_pending_email_lower', 'case-insensitive pending email lookup');
  assertPlanUses("SELECT email FROM banned_emails WHERE lower(email) = lower('test@example.com')", 'idx_banned_emails_email_lower', 'case-insensitive banned email lookup');
  assertPlanUses("SELECT pawns.*, users.username AS owner_username FROM pawns JOIN users ON users.id = pawns.user_id WHERE pawns.user_id = 'user-id' AND pawns.status = 'approved' ORDER BY pawns.created_at DESC", 'idx_pawns_user_status_created_at', 'public user profile pawn listing');

  console.log('Query optimization validation passed.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

function explain(sql) {
  return execFileSync('sqlite3', [db, 'EXPLAIN QUERY PLAN ' + sql + ';'], { encoding: 'utf8' });
}

function assertPlanUses(sql, expectedIndex, label) {
  const plan = explain(sql);
  if (!plan.includes(expectedIndex)) {
    console.error('Expected ' + label + ' to use ' + expectedIndex + ', but got:\n' + plan);
    process.exit(1);
  }
  console.log(label + ': ' + expectedIndex);
}
