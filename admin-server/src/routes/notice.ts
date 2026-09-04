import { Hono } from 'hono';
export function initNoticeRoutes(app, getEnv) {
  app.get('/notice', async (c) => {
    const env = getEnv();
    const row = await env.DB.prepare('SELECT * FROM notice_board WHERE id = 1').first();
    return c.json(row || { title: '旸镔疰箤绯', sections_json: '[]' });
  });

  app.post('/notice', async (c) => {
    const env = getEnv();
    const { title, sections } = await c.req.json().catch(() => ({}));
    env.DB.prepare(`INSERT INTO notice_board (id, title, sections_json, updated_at) VALUES (1, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET title=excluded.title, sections_json=excluded.sections_json, updated_at=datetime('now')`).run(title || '闘閗斡y��靮', JSON.stringify(sections || []));
    return c.json({ ok: true });
  });
}