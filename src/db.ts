import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { Usage, Stats } from './types';

const DB_DIR = join(homedir(), '.token-tracker');
const DB_PATH = join(DB_DIR, 'usage.db');

// Ensure directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost REAL NOT NULL,
    timestamp TEXT NOT NULL,
    notes TEXT
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_provider ON usage(provider);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON usage(timestamp);
`);

export function addUsage(usage: Omit<Usage, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO usage (provider, model, prompt_tokens, completion_tokens, total_tokens, cost, timestamp, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    usage.provider,
    usage.model,
    usage.promptTokens,
    usage.completionTokens,
    usage.totalTokens,
    usage.cost,
    usage.timestamp,
    usage.notes || null
  );

  return result.lastInsertRowid as number;
}

export function getUsage(filters?: {
  provider?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Usage[] {
  let query = 'SELECT * FROM usage WHERE 1=1';
  const params: any[] = [];

  if (filters?.provider) {
    query += ' AND provider = ?';
    params.push(filters.provider);
  }

  if (filters?.startDate) {
    query += ' AND timestamp >= ?';
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ' AND timestamp <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY timestamp DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map((row) => ({
    id: row.id,
    provider: row.provider,
    model: row.model,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    cost: row.cost,
    timestamp: row.timestamp,
    notes: row.notes,
  }));
}

export function getStats(filters?: {
  provider?: string;
  startDate?: string;
  endDate?: string;
}): Stats {
  let query = 'SELECT * FROM usage WHERE 1=1';
  const params: any[] = [];

  if (filters?.provider) {
    query += ' AND provider = ?';
    params.push(filters.provider);
  }

  if (filters?.startDate) {
    query += ' AND timestamp >= ?';
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ' AND timestamp <= ?';
    params.push(filters.endDate);
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  const stats: Stats = {
    totalRequests: rows.length,
    totalTokens: 0,
    totalCost: 0,
    byProvider: {},
    byModel: {},
  };

  for (const row of rows) {
    stats.totalTokens += row.total_tokens;
    stats.totalCost += row.cost;

    // By provider
    if (!stats.byProvider[row.provider]) {
      stats.byProvider[row.provider] = { requests: 0, tokens: 0, cost: 0 };
    }
    stats.byProvider[row.provider].requests++;
    stats.byProvider[row.provider].tokens += row.total_tokens;
    stats.byProvider[row.provider].cost += row.cost;

    // By model
    const modelKey = `${row.provider}/${row.model}`;
    if (!stats.byModel[modelKey]) {
      stats.byModel[modelKey] = { requests: 0, tokens: 0, cost: 0 };
    }
    stats.byModel[modelKey].requests++;
    stats.byModel[modelKey].tokens += row.total_tokens;
    stats.byModel[modelKey].cost += row.cost;
  }

  return stats;
}

export function clearUsage(filters?: { provider?: string; before?: string }): number {
  let query = 'DELETE FROM usage WHERE 1=1';
  const params: any[] = [];

  if (filters?.provider) {
    query += ' AND provider = ?';
    params.push(filters.provider);
  }

  if (filters?.before) {
    query += ' AND timestamp < ?';
    params.push(filters.before);
  }

  const stmt = db.prepare(query);
  const result = stmt.run(...params);

  return result.changes;
}

export function closeDb(): void {
  db.close();
}
