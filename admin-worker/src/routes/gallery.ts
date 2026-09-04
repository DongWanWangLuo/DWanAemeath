import { Hono } from 'hono';
import type { Env } from '../db';
import type { Context } from 'hono';

export async function initGalleryRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => any) {
  app.get('/albums', async (c: Context) => {
    const env = getEnv();
    const results = await env.DB.prepare('SELECT * FROM albums ORDER BY updated_at DESC').all() as any[];
    return c.json({ albums: results || [] });
  });

  app.get('/albums/:slug', async (c: Context) => {
    const env = getEnv();
    const slug = c.req.param('slug')!;
    const row = await env.DB.prepare('SELECT * FROM albums WHERE slug = ?').get(slug) as any;
    if (!row) return c.json({ error: 'Not found' }, 404);
    const photos = await env.DB.prepare('SELECT * FROM album_photos WHERE album_slug = ? ORDER BY sort_order ASC').bind(slug).all() as any[];
    return c.json({ album: row, photos: photos || [] });
  });

  app.post('/albums', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({})) as any;
    const { slug, title, desc, date, location, tags, cover, encrypted, password_hint, source, content, photos } = body;
    if (!slug) return c.json({ error: 'Missing slug' }, 400);
    const tagsJson = tags ? JSON.stringify(tags) : null;
    await env.DB.prepare(
      INSERT INTO albums (slug, title, desc, date, location, tags, cover, encrypted, password_hint, source, content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title, desc = excluded.desc, date = excluded.date,
        location = excluded.location, tags = excluded.tags, cover = excluded.cover,
        encrypted = excluded.encrypted, password_hint = excluded.password_hint,
        source = excluded.source, content = excluded.content, updated_at = datetime('now')
    ).bind(slug, title || '', desc || null, date || null, location || null, tagsJson, cover || null, encrypted ? 1 : 0, password_hint || null, source || 'local', content || '').run();

    await env.DB.prepare('DELETE FROM album_photos WHERE album_slug = ?').bind(slug).run();
    if (photos && Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        await env.DB.prepare('INSERT INTO album_photos (album_slug, url, type, poster, date, sort_order) VALUES (?, ?, ?, ?, ?, ?)').bind(slug, p.url, p.type || null, p.poster || null, p.date || null, i).run();
      }
    }
    return c.json({ ok: true });
  });

  app.delete('/albums/:slug', async (c: Context) => {
    const env = getEnv();
    const slug = c.req.param('slug')!;
    await env.DB.prepare('DELETE FROM album_photos WHERE album_slug = ?').bind(slug).run();
    await env.DB.prepare('DELETE FROM albums WHERE slug = ?').bind(slug).run();
    return c.json({ ok: true });
  });
}

export async function initFriendsRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => any) {
  app.get('/friends', async (c: Context) => {
    const env = getEnv();
    const results = await env.DB.prepare('SELECT * FROM friends WHERE enabled = 1 ORDER BY weight DESC, id DESC').all() as any[];
    return c.json({ friends: results || [] });
  });

  app.post('/friends', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({})) as any;
    const { title, imgurl, desc, siteurl, tags, weight } = body;
    await env.DB.prepare(
      'INSERT INTO friends (title, imgurl, desc, siteurl, tags, weight, enabled) VALUES (?, ?, ?, ?, ?, ?, 1)'
    ).bind(title || '', imgurl || '', desc || '', siteurl || '', tags || '', weight || 0).run();
    return c.json({ ok: true });
  });

  app.put('/friends/:id', async (c: Context) => {
    const env = getEnv();
    const id = c.req.param('id')!;
    const body = await c.req.json().catch(() => ({})) as any;
    await env.DB.prepare(
      'UPDATE friends SET title=?, imgurl=?, desc=?, siteurl=?, tags=?, weight=?, enabled=? WHERE id=?'
    ).bind(body.title, body.imgurl, body.desc, body.siteurl, body.tags, body.weight, body.enabled ?? 1, id).run();
    return c.json({ ok: true });
  });

  app.delete('/friends/:id', async (c: Context) => {
    const env = getEnv();
    const id = c.req.param('id')!;
    await env.DB.prepare('DELETE FROM friends WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
  });
}
