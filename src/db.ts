import Database from 'better-sqlite3'

export type ClawDatabase = Database.Database

export function createDatabase(dbPath: string): ClawDatabase {
  const db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tiers (
      conversation_id TEXT NOT NULL,
      tier TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (conversation_id, tier)
    );

    CREATE TABLE IF NOT EXISTS token_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      tier_tokens INTEGER,
      history_tokens INTEGER,
      total_tokens INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conv
      ON messages(conversation_id, archived, created_at);

    CREATE INDEX IF NOT EXISTS idx_usage_conv
      ON token_usage(conversation_id, created_at);
  `)

  return db
}
