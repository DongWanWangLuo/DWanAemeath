export async function POST({ request }: { request: Request }) {
  const body = await request.text();
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:3001";
  const resp = await fetch(base + "/admin/init-admin", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
