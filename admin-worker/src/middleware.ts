import type { Env } from './db';
import * as session from './auth';

export interface AuthenticatedContext {
  env: Env;
  request: Request;
  get: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  json: (data: unknown, status?: number) => Response;
  next: () => Promise<Response>;
}

export function authMiddleware(getEnv: () => Env) {
  return async function middleware(c: any, next: () => Promise<any>) {
    const env = getEnv();
    const cookieHeader = c.req.header('Cookie');
    const token = session.getCookieValue(cookieHeader, session.ADMIN_SESSION_COOKIE);

    const publicPaths = ['/login', '/init-admin', '/change-password'];
    const path = c.req.path.replace(/^\/admin/, '');
    
    if (publicPaths.some(p => path === p || c.req.path === '/admin' + p)) {
      return next();
    }

    if (path === '/session' || c.req.path === '/admin/session') {
      let username: string | null = null;
      if (token) {
        try { username = await session.getSessionUser(token, env.SESSION_SECRET); } catch {}
      }
      return c.json(username ? { authenticated: true, username } : { authenticated: false });
    }

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let username: string | null = null;
    try {
      username = await session.getSessionUser(token, env.SESSION_SECRET);
    } catch {}

    if (!username) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = env.DB;
    const row = await db.prepare('SELECT enabled FROM admin_users WHERE username = ?').get(username) as { enabled: number } | undefined;
    if (row && row.enabled !== 1) {
      c.header('Set-Cookie', session.buildClearSessionCookie());
      return c.json({ error: 'Account disabled' }, 403);
    }

    (c as any).set('username', username);
    return next();
  };
}
