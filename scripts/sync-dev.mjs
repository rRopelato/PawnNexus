#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const PROD_DB = 'pawnnexus';
const DEV_DB = 'pawnnexus-dev';
const PROD_CONFIG = 'worker/wrangler.toml';
const DEV_CONFIG = 'worker/wrangler.dev.toml';
const TOKEN_TABLES = new Set(['email_verification_tokens', 'password_reset_tokens']);
const INTERNAL_TABLES = new Set(['_cf_KV', 'd1_migrations', 'sqlite_sequence']);
const CHUNK_SIZE = 25;

async function main() {
  await confirmOrExit();

  console.log('Applying pending migrations to dev D1 only...');
  runWrangler(['d1', 'migrations', 'apply', DEV_DB, '--remote', '--config', DEV_CONFIG], { inherit: true, safeError: 'Unable to apply dev migrations' });

  const prodTables = await getTables('prod');
  const devTables = await getTables('dev');
  const appDevTables = devTables.filter(isApplicationTable);
  const appProdTables = prodTables.filter(isApplicationTable);
  const commonTables = appDevTables.filter((table) => appProdTables.includes(table));
  const copyTables = commonTables.filter((table) => !TOKEN_TABLES.has(table));
  const tokenTables = commonTables.filter((table) => TOKEN_TABLES.has(table));
  const devOnlyTables = appDevTables.filter((table) => !appProdTables.includes(table));
  const prodOnlyTables = appProdTables.filter((table) => !appDevTables.includes(table));

  const allClearTables = [...new Set([...copyTables, ...tokenTables, ...devOnlyTables])];
  const orderedClearTables = await orderTablesByForeignKeys(allClearTables, 'dev');
  const orderedCopyTables = await orderTablesByForeignKeys(copyTables, 'dev');

  const summary = {
    copied: new Map(),
    skippedTokens: 0,
    devOnlyCleared: devOnlyTables.length,
    prodOnlySkipped: prodOnlyTables.length,
  };

  console.log('Clearing dev application tables. d1_migrations will be kept intact.');
  for (const table of [...orderedClearTables].reverse()) {
    await executeDev('DELETE FROM ' + quoteIdent(table) + ';', 'Unable to clear dev table ' + table);
  }

  for (const table of tokenTables) {
    const rows = await selectRows('prod', 'SELECT COUNT(*) AS count FROM ' + quoteIdent(table) + ';');
    summary.skippedTokens += Number(rows[0]?.count ?? 0);
  }

  for (const table of orderedCopyTables) {
    const prodColumns = await getColumns('prod', table);
    const devColumns = await getColumns('dev', table);
    const devColumnNames = new Set(devColumns.map((column) => column.name));
    const columns = prodColumns.map((column) => column.name).filter((name) => devColumnNames.has(name));
    const rows = await selectRows('prod', 'SELECT ' + columns.map(quoteIdent).join(', ') + ' FROM ' + quoteIdent(table) + ';');

    for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
      const chunk = rows.slice(index, index + CHUNK_SIZE);
      if (chunk.length === 0) continue;
      const sql = chunk.map((row) => buildInsert(table, columns, row)).join('\n');
      await executeDev(sql, 'Unable to copy table ' + table);
    }

    summary.copied.set(table, rows.length);
  }

  printSummary(summary, tokenTables, devOnlyTables, prodOnlyTables);
}

async function confirmOrExit() {
  if (process.argv.includes('--yes')) return;

  console.log('');
  console.log('WARNING: npm run sync-dev copies PRODUCTION D1 data into DEV D1.');
  console.log('- Reads from production database: ' + PROD_DB);
  console.log('- Writes only to development database: ' + DEV_DB);
  console.log('- Keeps production untouched.');
  console.log('- Keeps R2 images as-is; production and dev share the same R2 bucket.');
  console.log('- Clears dev app tables before copying. d1_migrations is preserved.');
  console.log('- Does not copy password reset or email verification tokens.');
  console.log('');

  if (!process.stdin.isTTY) {
    console.error('Refusing to run without an interactive confirmation. Use npm run sync-dev -- --yes if you really intend to sync dev.');
    process.exit(1);
  }

  const rl = createInterface({ input, output });
  const answer = await rl.question('Type sync dev to continue: ');
  rl.close();

  if (answer.trim() !== 'sync dev') {
    console.log('Cancelled.');
    process.exit(0);
  }
}

async function getTables(target) {
  const rows = await selectRows(target, "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;");
  return rows.map((row) => String(row.name));
}

async function getColumns(target, table) {
  return selectRows(target, 'PRAGMA table_info(' + quoteIdent(table) + ');');
}

async function getForeignKeys(target, table) {
  return selectRows(target, 'PRAGMA foreign_key_list(' + quoteIdent(table) + ');');
}

async function orderTablesByForeignKeys(tables, target) {
  const tableSet = new Set(tables);
  const deps = new Map();

  for (const table of tables) {
    const foreignKeys = await getForeignKeys(target, table);
    deps.set(table, foreignKeys.map((row) => String(row.table)).filter((parent) => tableSet.has(parent)));
  }

  const ordered = [];
  const temporary = new Set();
  const permanent = new Set();

  function visit(table) {
    if (permanent.has(table)) return;
    if (temporary.has(table)) return;
    temporary.add(table);
    for (const parent of deps.get(table) ?? []) visit(parent);
    temporary.delete(table);
    permanent.add(table);
    ordered.push(table);
  }

  for (const table of tables) visit(table);
  return ordered;
}

async function selectRows(target, sql) {
  const args = ['d1', 'execute', target === 'prod' ? PROD_DB : DEV_DB, '--remote', '--config', target === 'prod' ? PROD_CONFIG : DEV_CONFIG, '--command', sql];
  const result = runWrangler(args, { safeError: 'Unable to read ' + target + ' D1' });
  const payload = parseWranglerJson(result.stdout);
  const first = payload[0];

  if (!first?.success) {
    throw new Error('D1 read failed for ' + target);
  }

  return first.results ?? [];
}

async function executeDev(sql, safeError) {
  runWrangler(['d1', 'execute', DEV_DB, '--remote', '--config', DEV_CONFIG, '--command', sql], { safeError });
}

function runWrangler(args, options = {}) {
  const result = spawnSync('npx', ['wrangler', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(options.safeError ?? 'Wrangler command failed');
  }

  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function parseWranglerJson(stdout) {
  const start = stdout.indexOf('[');
  const end = stdout.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Unable to parse Wrangler JSON output');
  }
  return JSON.parse(stdout.slice(start, end + 1));
}

function buildInsert(table, columns, row) {
  const columnSql = columns.map(quoteIdent).join(', ');
  const valueSql = columns.map((column) => sqlValue(row[column])).join(', ');
  return 'INSERT INTO ' + quoteIdent(table) + ' (' + columnSql + ') VALUES (' + valueSql + ');';
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'NULL';
    return String(value);
  }
  if (typeof value === 'boolean') return value ? '1' : '0';
  return "'" + String(value).replace(/\u0000/g, '').replace(/'/g, "''") + "'";
}

function quoteIdent(identifier) {
  return '"' + String(identifier).replace(/"/g, '""') + '"';
}

function isApplicationTable(table) {
  if (INTERNAL_TABLES.has(table)) return false;
  if (table.startsWith('sqlite_')) return false;
  return true;
}

function printSummary(summary, tokenTables, devOnlyTables, prodOnlyTables) {
  console.log('');
  console.log('Dev sync complete. Production was not modified.');
  console.log('');
  console.log('Copied rows:');
  for (const [table, count] of summary.copied.entries()) {
    console.log('- ' + table + ': ' + count);
  }
  console.log('');
  console.log('Skipped token rows: ' + summary.skippedTokens + (tokenTables.length ? ' (' + tokenTables.join(', ') + ')' : ''));
  if (devOnlyTables.length) console.log('Dev-only tables cleared: ' + devOnlyTables.join(', '));
  if (prodOnlyTables.length) console.log('Production-only tables skipped because they do not exist in dev: ' + prodOnlyTables.join(', '));
  console.log('');
  console.log('R2 images were not copied. Dev and production use the same R2 bucket.');
}

main().catch((error) => {
  console.error('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  process.exit(1);
});
