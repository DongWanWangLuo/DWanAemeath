export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.search;
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:3001";
  const resp = await fetch(base + "/admin/posts" + q, { headers: { Cookie: request.headers.get("Cookie") || "" } });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function POST({ request }: { request: Request }) {
  const body = await request.text();
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:3001";
  const resp = await fetch(base + "/admin/posts", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Cookie: request.headers.get("Cookie") || "" }, body });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function PUT({ params, request }: { params: { slug: string }; request: Request }) {
  const body = await request.text();
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:3001";
  const resp = await fetch(base + "/admin/posts/" + params.slug, { method: "PUT", headers: { "Content-Type": "application/json; charset=utf-8", Cookie: request.headers.get("Cookie") || "" }, body });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function DELETE({ params }: { params: { slug: string } }) {
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:3001";
  const resp = await fetch(base + "/admin/posts/" + params.slug, { method: "DELETE" });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
