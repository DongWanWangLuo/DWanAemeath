export async function POST({ request }: { request: Request }) {
  const body = await request.text();
  const base = process.env.ADMIN_BACKEND_URL || 'http://localhost:8787';
  const resp = await fetch(base + '/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  const data = await resp.json().catch(() => ({}));
  const setCookie = resp.headers.get('Set-Cookie');
  const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' };
  if (setCookie) headers['Set-Cookie'] = setCookie;
  return new Response(JSON.stringify(data), { status: resp.status, headers });
}
