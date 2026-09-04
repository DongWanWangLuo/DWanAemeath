import { Hono } from 'hono';
import type { Env } from '../db';
import type { Context } from 'hono';

export async function initNoticeRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => any) {
  app.get('/notice', async (c: Context) => {
    const env = getEnv();
    const row = await env.DB.prepare('SELECT * FROM notice_board WHERE id = 1').get() as any;
    return c.json(row || { title: '公告栏', sections_json: '[]' });
  });

  app.put('/notice', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({})) as any;
    const { title, sections_json } = body;
    await env.DB.prepare(
      'INSERT INTO notice_board (id, title, sections_json, updated_at) VALUES (1, ?, ?, datetime(\'now\')) ON CONFLICT(id) DO UPDATE SET title=excluded.title, sections_json=excluded.sections_json, updated_at=datetime(\'now\')'
    ).bind(title || '公告栏', sections_json || '[]').run();
    return c.json({ ok: true });
  });
}

export async function initDynamicRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => any) {
  app.get('/dynamics', async (c: Context) => {
    const env = getEnv();
    const results = await env.DB.prepare(
      'SELECT * FROM dynamics ORDER BY pinned DESC, created_at DESC LIMIT 50'
    ).all() as any[];
    return c.json({ dynamics: results || [] });
  });

  app.post('/dynamics', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({})) as any;
    const id = body.id || crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO dynamics (id, content, images, published, pinned, location, search_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\')) ON CONFLICT(id) DO NOTHING'
    ).bind(id, body.content, JSON.stringify(body.images || []), body.published ? 1 : 0, body.pinned ? 1 : 0, body.location || '', body.search_text || '').run();
    return c.json({ ok: true, id });
  });

  app.put('/dynamics/:id', async (c: Context) => {
    const env = getEnv();
    const id = c.req.param('id')!;
    const body = await c.req.json().catch(() => ({})) as any;
    await env.DB.prepare(
      'UPDATE dynamics SET content=?, images=?, published=?, pinned=?, location=?, search_text=?, updated_at=datetime(\'now\') WHERE id=?'
    ).bind(body.content, JSON.stringify(body.images || []), body.published ? 1 : 0, body.pinned ? 1 : 0, body.location || '', body.search_text || '', id).run();
    return c.json({ ok: true });
  });

  app.delete('/dynamics/:id', async (c: Context) => {
    const env = getEnv();
    const id = c.req.param('id')!;
    await env.DB.prepare('DELETE FROM dynamics WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
  });
}
