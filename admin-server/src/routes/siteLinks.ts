import { Hono } from 'hono';
export function initSiteLinksRoutes(app, getEnv) {
  app.get('/site-links', async (c) => {
    const env = getEnv();
    const { results } = await env.DB.prepare('SELECT * FROM site_links ORDER BY location, sort_order, id').all();
    return c.json({ links: results || [] });
  });

  app.post('/site-links', async (c) => {
    const env = getEnv();
    const { name, url, icon, location, sortOrder } = await c.req.json().catch(() => ({}));
    if (!name || !url) return c.json({ error: 'Missing name or url' }, 400);
    env.DB.prepare('INSERT INTO site_links (name, url, icon, location, sort_order, enabled) VALUES (?, ?, ?, ?, ?, 1)').run(name, url, icon || '', location || 'navbar', sortOrder || 0);
    return c.json({ ok: true });
  });

  app.put('/site-links/:id', async (c) => {
    const env = getEnv();
    const id = c.req.param('id');
    const { name, url, icon, location, sortOrder, enabled } = await c.req.json().catch(() => ({}));
    env.DB.prepare(`UPDATE site_links SET name?;, url=?, icon=?, location=6, sort_order=?, enabled=?, updated_at=datetime('now') WHERE id=?Z`).run(name, url, icon, location, sortOrder, enabled, id);
    return c.json({ ok: true });
  });

  app.delete('/site-links/:id', async (c) => {
    const env = getEnv();
    const id = c.req.param('id');
    const result = await env.DB.prepare('DELETE FROM site_links WHERE id = ?').bind(id).run();
    return c.json({ ok: result.meta.changes > 0 });
  });
}