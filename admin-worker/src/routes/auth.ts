import { Hono } from 'hono';
import type { Env, getEnv } from './db';
import * as session from './auth';
import type { Context } from 'hono';

export async function initAuthRoutes(app: Hono<{ Bindings: Env }>, getEnv: () => ReturnType<typeof getEnv>) {
  // Login
  app.post('/login', async (c: Context) => {
    const body = await c.req.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string };
    if (!username || !password) {
      return c.json({ error: 'Missing username or password' }, 400);
    }
    const env = getEnv();
    const user = await env.DB.prepare(
      'SELECT id, username, password_hash, enabled FROM admin_users WHERE username = ?'
    ).bind(username.trim()).get() as any;
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const valid = await session.verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const token = await session.createSessionToken(user.username, env.SESSION_SECRET);
    c.header('Set-Cookie', session.buildSessionCookie(token));
    return c.json({ ok: true, username: user.username });
  });

  // Logout
  app.post('/logout', async (c: Context) => {
    c.header('Set-Cookie', session.buildClearSessionCookie());
    return c.json({ ok: true });
  });

  // Session check
  app.get('/session', async (c: Context) => {
    const env = getEnv();
    const token = session.getCookieValue(c.req.header('Cookie'), session.ADMIN_SESSION_COOKIE);
    let username: string | null = null;
    if (token) {
      try { username = await session.getSessionUser(token, env.SESSION_SECRET); } catch {}
    }
    return c.json(username ? { authenticated: true, username } : { authenticated: false });
  });

  // Init admin (create first admin user)
  app.post('/init-admin', async (c: Context) => {
    const env = getEnv();
    const body = await c.req.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string };
    if (!username || !password) {
      return c.json({ error: 'Missing credentials' }, 400);
    }
    const existing = await env.DB.prepare('SELECT COUNT(*) AS c FROM admin_users').get() as { c: number };
    if ((existing?.c ?? 0) > 0) {
      return c.json({ ok: false, conflict: true });
    }
    const hash = await session.hashPassword(password);
    await env.DB.prepare(
      'INSERT INTO admin_users (username, password_hash, enabled) VALUES (?, ?, 1)'
    ).bind(username.trim(), hash).run();
    return c.json({ ok: true });
  });

  // Change password
  app.post('/change-password', async (c: Context) => {
    const env = getEnv();
    const username = (c.req.raw as any).username as string;
    if (!username) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json().catch(() => ({}));
    const { password } = body as { password?: string };
    if (!password) return c.json({ error: 'Missing password' }, 400);
    const hash = await session.hashPassword(password);
    await env.DB.prepare(
      'UPDATE admin_users SET password_hash = ?, updated_at = datetime(\'now\') WHERE username = ?'
    ).bind(hash, username).run();
    return c.json({ ok: true });
  });
}
