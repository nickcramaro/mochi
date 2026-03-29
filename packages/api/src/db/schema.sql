CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mochis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  name TEXT NOT NULL DEFAULT 'Mochi',
  stage TEXT NOT NULL DEFAULT 'egg',
  warmth REAL NOT NULL DEFAULT 0.5,
  energy REAL NOT NULL DEFAULT 0.5,
  complexity REAL NOT NULL DEFAULT 0.5,
  stability REAL NOT NULL DEFAULT 0.5,
  size REAL NOT NULL DEFAULT 0.0,
  curiosity REAL NOT NULL DEFAULT 0.5,
  intensity REAL NOT NULL DEFAULT 0.5,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  dormancy_state TEXT NOT NULL DEFAULT 'awake',
  last_fed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mochi_id INTEGER NOT NULL REFERENCES mochis(id),
  duration_minutes REAL NOT NULL,
  tool_usage TEXT NOT NULL DEFAULT '{}',
  sentiment_avg REAL NOT NULL DEFAULT 0.0,
  sentiment_variance REAL NOT NULL DEFAULT 0.0,
  iteration_count INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 1,
  time_of_day TEXT NOT NULL,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
