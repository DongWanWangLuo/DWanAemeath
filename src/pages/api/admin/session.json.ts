export async function GET({ request }: { request: Request }) {
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:3001";
  const resp = await fetch(base + "/admin/session", { headers: { Cookie: request.headers.get("Cookie") || "" } });
  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
