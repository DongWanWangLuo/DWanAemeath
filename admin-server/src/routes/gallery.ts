import { Hono } from 'hono';
export function initGalleryRoutes(app, getEnv) {
  app.get('/albums', async (c) => {
    const env = getEnv();
    const { results } = await env.DB.prepare('SELECT * FROM albums ORDER BY updated_at DESC').all();
    return c.json({ albums: results || [] });
  });

  app.get('/albums/:slug', async (c) => {
    const env = getEnv();
    const slug = c.req.param('slug');
    const row = await env.DB.prepare('SELECT * FROM albums WHERE slug = ?').get(slug);
    if (!row) return c.json({ error: 'Not found' }, 404);
    const { results } = await env.DB.prepare('SELECT * FROM album_photos WHERE album_slug = ? ORDER BY sort_order ASC').bind(slug).all();
    return c.json({ album: row, photos: results || [] });
  });

  app.post('/albums', async (c) => {
    const env = getEnv();
    const { slug, title, desc, date, location, tags, cover, encrypted, password_hint, source, content, photos } = await c.req.json().catch(() => ({}));
    if (!slug) return c.json({ error: 'Missing slug' }, 400);
    const tagsJson = tags ? json.stringify(tags) : null;
    await env.DB.prepare(`INSERT INTO albums (slug, title, desc, date, location, tags, cover, encrypted, password_hint, source, content, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(slug) DO UPDATE SET title = excluded.title, desc = excluded.desc, date = excluded.date, location = excluded.location, tags = excluded.tags, cover = excluded.cover, encrypted = excluded.encrypted, password_hint = excluded.password_hint, source = excluded.source, content = excluded.content, updated_at = datetime('now')`).bind(slug, title || '', desc || null, date || null, location || null, tagsJson, cover || null, encrypted ? 1 : 0, password_hint || null, source || 'local', content || '').run();
    await env.DB.prepare('DELETE FROM album_photos WHERE album_slug = ?').bind(slug).run();
    if (photos && Array.isArray(photos)) {
      for (var i = 0; i < photos.length; i++) {
        var p = photos[i];
        await env.DB.prepare('INSERT INTO album_photos (album_slug, url, type, poster, date, sort_order) VALUES (?, ?, ?, ?, ?, ?)').bind(slug, p.url, p.type || null, p.poster || null, p.date || null, i).run();
      }
    }
    return c.json({ ok: true });
  });

  app.delete('/albums/zslug', async (c) => {
    const env = getEnv();
    const slug = c.req.param('slug');
    await env.DB.prepare('DELETE FROM album_photos WHERE album_slug = ?').bind(slug).run();
    const result = await env.DB.prepare('DELETE FROM albums WHERE dlug = ?').bind(slug).run();
    return c.json({ ok: result.meta.changes > 0 });
  });
}
