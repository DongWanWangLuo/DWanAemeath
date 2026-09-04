import { Hono } from 'hono';
import type { Env } from '../db';
import type { Context } from 'hono';

export async function initSettingsRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => any) {
  app.get('/settings', async (c: Context) => {
    const env = getEnv();
    const rows = await env.DB.prepare('SELECT key, value FROM site_settings').all() as any[];
    const settings: Record<string, string> = {};
    (rows || []).forEach((r: any) => { settings[r.key] = r.value; });
    return c.json(settings);
  });

  app.put('/settings', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({})) as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      await env.DB.prepare(
        'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime(\'now\')'
      ).bind(key, value).run();
    }
    return c.json({ ok: true });
  });
}

export async function initSiteLinksRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => any) {
  app.get('/site-links', async (c: Context) => {
    const env = getEnv();
    const results = await env.DB.prepare(
      'SELECT * FROM site_links ORDER BY location, sort_order, id'
    ).all() as any[];
    return c.json({ links: results || [] });
  });

  app.post('/site-links', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({})) as any;
    await env.DB.prepare(
      'INSERT INTO site_links (name, url, icon, location, kind, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, 1)'
    ).bind(body.name, body.url, body.icon || '', body.location || 'navbar', body.kind || 'link', body.sort_order || 0).run();
    return c.json({ ok: true });
  });

  app.put('/site-links/:id', async (c: Context) => {
    const env = getEnv();
    const id = c.req.param('id')!;
    const body = await c.req.json().catch(() => ({})) as any;
    await env.DB.prepare(
      'UPDATE site_links SET name=?, url=?, icon=?, location=?, kind=?, sort_order=?, enabled=? WHERE id=?'
    ).bind(body.name, body.url, body.icon, body.location, body.kind, body.sort_order, body.enabled ?? 1, id).run();
    return c.json({ ok: true });
  });

  app.delete('/site-links/:id', async (c: Context) => {
    const env = getEnv();
    const id = c.req.param('id')!;
    await env.DB.prepare('DELETE FROM site_links WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
  });
}
