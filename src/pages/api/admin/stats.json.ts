export async function GET({ request }: { request: Request }) {
  const base = process.env.ADMIN_BACKEND_URL || 'http://localhost:8787';
  const cookie = request.headers.get('Cookie') || '';
  const resp = await fetch(base + '/admin/stats', { headers: { Cookie: cookie } });
  if (!resp.ok) return new Response(JSON.stringify({ posts: 0, friends: 0, dynamics: 0 }), { headers: { 'Content-Type': 'application/json' } });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
