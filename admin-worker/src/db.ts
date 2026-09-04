import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
}

export function getDb(c: { env: Env }) {
  return c.env.DB;
}

export function getEnv(c: { env: Env }) {
  return {
    DB: c.env.DB,
    SESSION_SECRET: c.env.SESSION_SECRET || 'dev-secret-change-me',
  };
}
