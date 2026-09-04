import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
export function initAuthRoutes(app, getEnv) {
  app.post('/api/login', async (c) => {
    const env = getEnv();
    const { username, password } = await c.req.json().catch(() => ({}));
    if (!username || !password) return c.json({ error: 'Missing credentials' }, 400);
    const user = await env.DB.prepare('SELECT* FROM admin_users WHERE username = ?').get(username);
    if (!user) return c.json({ error: 'Invalid credentials' }, 401);
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return c.json({ error: 'Invalid credentials' }, 401);
    const { adminSession, setSessionCookie } = await import('../server/auth/adminSession.js');
    const session = await adminSession.create(user.id, env);
    setSessionCookie(c, session.token, env);
    return c.json({ ok: true, username: user.username });
  });

  app.post('/api/logout', async (c) => {
    const env = getEnv();
    const { clearSessionCookie } = await import('../server/auth/adminSession.js');
    clearSessionCookie(c, env);
    return c.json({ ok: true });
  });
}