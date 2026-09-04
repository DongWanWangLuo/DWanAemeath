import { Hono } from 'hono';
import type { Env } from '../db';
import type { Context } from 'hono';

function decodePostSlug(path: string) {
  return decodeURIComponent(path.split('/').pop() || path);
}

export async function initPostRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => any) {
  // List posts
  app.get('/posts', async (c: Context) => {
    const env = getEnv();
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(c.req.query('pageSize') || '20')));
    const offset = (page - 1) * pageSize;
    const results = await env.DB.prepare(
      'SELECT * FROM posts WHERE published = 1 ORDER BY pin_order DESC, date DESC LIMIT ? OFFSET ?'
    ).bind(pageSize, offset).all() as any[];
    const countRow = await env.DB.prepare('SELECT COUNT(*) AS total FROM posts WHERE published = 1').get() as { total: number };
    const total = countRow?.total || 0;
    return c.json({
      posts: (results || []).map(r => ({ ...r, path: '/posts/' + encodeURIComponent(r.slug) })),
      total, page, pageSize,
    });
  });

  // List all posts (including drafts)
  app.get('/all-posts', async (c: Context) => {
    const env = getEnv();
    const results = await env.DB.prepare(
      'SELECT slug, title, date, published, cover, pin_order FROM posts ORDER BY pin_order DESC, date DESC'
    ).all() as any[];
    return c.json({ posts: results || [] });
  });

  // Get post
  app.get('/posts/:slug', async (c: Context) => {
    const env = getEnv();
    const slug = decodePostSlug(c.req.param('slug')!);
    const row = await env.DB.prepare('SELECT * FROM posts WHERE slug = ?').get(slug) as any;
    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json(row);
  });

  // Create/update post
  app.post('/posts', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({})) as any;
    const { slug, title, excerpt, description, date, updated, categories, tags, cover, published, password, fm_json, words, minutes, r2_key, pin_order } = body;
    if (!slug) return c.json({ error: 'Missing slug' }, 400);

    const fm = fm_json || '{}';
    const tagsJson = tags ? JSON.stringify(tags) : null;
    const catsJson = categories ? JSON.stringify(categories) : null;

    await env.DB.prepare(
      INSERT INTO posts (slug, title, excerpt, description, date, updated, categories, tags, cover, published, password, fm_json, words, minutes, r2_key, pin_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title, excerpt = excluded.excerpt, description = excluded.description,
        date = excluded.date, updated = excluded.updated, categories = excluded.categories,
        tags = excluded.tags, cover = excluded.cover, published = excluded.published,
        password = excluded.password, fm_json = excluded.fm_json, words = excluded.words,
        minutes = excluded.minutes, r2_key = excluded.r2_key, pin_order = excluded.pin_order,
        updated_at = datetime('now')
    ).bind(slug, title || '', excerpt || null, description || null, date || '', updated || null,
      catsJson, tagsJson, cover || null, published !== undefined ? published : 1, password || '',
      typeof fm === 'string' ? fm : JSON.stringify(fm), words || 0, minutes || 0, r2_key || '', pin_order || 0
    ).run();

    // Update taxonomy
    await env.DB.prepare('DELETE FROM post_taxonomy WHERE post_slug = ?').bind(slug).run();
    if (categories) {
      for (const cat of (Array.isArray(categories) ? categories : [])) {
        await env.DB.prepare('INSERT INTO post_taxonomy (post_slug, type, value) VALUES (?, \'category\', ?)').bind(slug, cat).run();
      }
    }
    if (tags) {
      for (const tag of (Array.isArray(tags) ? tags : [])) {
        await env.DB.prepare('INSERT INTO post_taxonomy (post_slug, type, value) VALUES (?, \'tag\', ?)').bind(slug, tag).run();
      }
    }
    return c.json({ ok: true });
  });

  // Delete post
  app.delete('/posts/:slug', async (c: Context) => {
    const env = getEnv();
    const slug = decodePostSlug(c.req.param('slug')!);
    await env.DB.prepare('DELETE FROM post_taxonomy WHERE post_slug = ?').bind(slug).run();
    const result = await env.DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug).run();
    return c.json({ ok: result.meta.changes > 0 });
  });
}
