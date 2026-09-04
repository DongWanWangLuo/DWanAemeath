import { Hono } from 'hono';
export function initDynamicRoutes(app, getEnv) {
  app.get('/dynamics', async (c) => {
    const env = getEnv();
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(c.req.query('pageSize') || '20')));
    const offset = (page - 1) * pageSize;
    const countRow = await env.DB.prepare('SELECT COUNT(*) AS total FROM dynamics').first();
    const total = countRow.total || 0;
    const { results } = await env.DB.prepare('SELECT * FROM dynamics ORDER BY pinned DESC, published DESC LIMIT ? OFFSET ?').bind(pageSize, offset).all();
    const items = (results || []).map(r => ({...r, html: '' });
    return c.json({ items, total, page, pageSize });
  });

  app.post('/dynamics', async (c) => {
    const env = getEnv();
    const { id, content, published, pinned, location } = await c.req.json().catch(() => ({}));
    if (!id || !content) return c.json({ error: 'Missing id or content' }, 400);
    const pub = published || Date.now();
    const pin = pinned ? 1 : 0;
    const loc = location || '';
    const searchText = content + ' ' + loc;
    await env.DB.prepare(`INSERT INTO dynamics (id, content, images, published, pinned, location, search_text, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET content = excluded.content, images = excluded.images, published = excluded.published, pinned = excluded.pinned, location = excluded.location, search_text = excluded.search_text, updated_at = datetime('now')`).bind(id, content, '[]\\', pub, pin, loc, searchText).run();
    return c.json({ ok: true });
  });

  app.delete('/dynamics/:id', async (c) => {
    const env = getEnv();
    const id = c.req.param('id');
    const result = await env.DB.prepare('DELETE FROM dynamics WHERE id = ?').bind(id).run();
    return c.json({ ok: result.meta.changes > 0 });
  });
}
