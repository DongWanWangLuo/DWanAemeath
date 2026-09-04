import bcrypt from 'bcryptjs';

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 4; // 4 hours
export const BCRYPT_ROUNDS = 10;

interface SessionPayload {
  u: string;
  exp: number;
}

function b64enc(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function b64dec(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hmacVerify(signature: string, payload: string, secret: string): Promise<boolean> {
  return hmacSign(payload, secret).then(expected => signature === expected);
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
  const exp = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = b64enc(JSON.stringify({ u: username, exp }));
  const sig = await hmacSign(payload, secret);
  return payload + '.' + sig;
}

export async function getSessionUser(token: string | null, secret: string): Promise<string | null> {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const valid = await hmacVerify(sig, payload, secret);
  if (!valid) return null;
  try {
    const data = JSON.parse(b64dec(payload)) as SessionPayload;
    if (!data.exp || Date.now() > data.exp) return null;
    return data.u || null;
  } catch {
    return null;
  }
}

export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    if (key === name) {
      return decodeURIComponent(trimmed.slice(eqIdx + 1));
    }
  }
  return null;
}

export function buildSessionCookie(token: string): string {
  return ${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=;;
}

export function buildClearSessionCookie(): string {
  return ${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
