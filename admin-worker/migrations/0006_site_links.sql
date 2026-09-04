ALTER TABLE site_links ADD COLUMN kind TEXT NOT NULL DEFAULT 'link';
CREATE TABLE IF NOT EXISTS site_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT 'navbar',
  kind TEXT NOT NULL DEFAULT 'link',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_site_links_location ON site_links(location, enabled, sort_order, id);
