CREATE TABLE IF NOT EXISTS albums (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  desc TEXT,
  date TEXT,
  location TEXT,
  tags TEXT,
  cover TEXT,
  encrypted INTEGER NOT NULL DEFAULT 0,
  password_hint TEXT,
  source TEXT NOT NULL DEFAULT 'local',
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS album_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_slug TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  poster TEXT,
  date TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (album_slug) REFERENCES albums(slug) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_album_photos_album_slug ON album_photos(album_slug);
CREATE TABLE IF NOT EXISTS album_passwords (
  album_slug TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
