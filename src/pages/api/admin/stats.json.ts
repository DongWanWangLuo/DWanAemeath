export async function GET({ request }: { request: Request }) {
  const base = process.env.ADMIN_BACKEND_URL || "http://localhost:3001";
  const posts = await fetch(base + "/admin/posts?page_size=1000", { headers: { Cookie: request.headers.get("Cookie") || "" } }).then(r => r.json()).catch(() => ({}));
  const friends = await fetch(base + "/admin/friends", { headers: { Cookie: request.headers.get("Cookie") || "" } }).then(r => r.json()).catch(() => ({}));
  return new Response(JSON.stringify({
    ok: true,
    totals: {
      posts: posts.total || 0,
      published: (posts.posts || []).filter(p => p.published === 1).length,
      draft: (posts.posts || []).filter(p => p.published === 0).length,
      friends: (friends.friends || []).length,
      friendsEnabled: (friends.friends || []).filter((f: any) => f.enabled).length,
    }
  }), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
