export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.search;
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:8787";
  const resp = await fetch(base + "/admin/settings" + q, { headers: { Cookie: request.headers.get("Cookie") || "" } });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function PUT({ request }: { request: Request }) {
  const body = await request.text();
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:8787";
  const resp = await fetch(base + "/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json; charset=utf-8", Cookie: request.headers.get("Cookie") || "" }, body });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
