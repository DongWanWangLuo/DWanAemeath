<script>
import { onMount } from "svelte";
export let token = "";

let stats = { posts: 0, categories: 0, tags: 0, lastBuild: "" };
let loading = true;
let error = "";

async function fetchStats() {
  if (!token) { error = "Set GitHub PAT in login to view stats"; loading = false; return; }
  try {
    const postsRes = await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/content/posts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!postsRes.ok) throw new Error("Failed to fetch posts");
    const posts = await postsRes.json();
    stats.posts = posts.filter(p => p.type === "dir").length;

    const tagsRes = await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/content/tags", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (tagsRes.ok) {
      const tags = await tagsRes.json();
      stats.tags = Array.isArray(tags) ? tags.length : 0;
    }

    const catsRes = await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/contents/src/content/categories", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (catsRes.ok) {
      const cats = await catsRes.json();
      stats.categories = Array.isArray(cats) ? cats.length : 0;
    }

    const branchRes = await fetch("https://api.github.com/repos/DongWanWangLuo/DWanAemeath/branches/main", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (branchRes.ok) {
      const branch = await branchRes.json();
      stats.lastBuild = branch.commit?.commit?.author?.date?.slice(0, 10) || "";
    }
  } catch (e) {
    error = e.message;
  } finally {
    loading = false;
  }
}

onMount(() => { fetchStats(); });
</script>

{#if loading}
  <div class="empty"><div class="spinner"></div><p>Loading...</p></div>
{:else if error}
  <div class="empty"><p class="err">{error}</p></div>
{:else}
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Posts</div>
      <div class="stat-value">{stats.posts}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Categories</div>
      <div class="stat-value">{stats.categories}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Tags</div>
      <div class="stat-value">{stats.tags}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Last Commit</div>
      <div class="stat-value" style="font-size:1.1rem">{stats.lastBuild || "—"}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Quick Actions</div>
    <div class="actions">
      <button class="btn btn-primary" onclick={() => { window.location.href = "/admin/"; }} data-page="posts">📝 Manage Posts</button>
      <button class="btn btn-secondary" onclick={() => { window.location.href = "/admin/"; }} data-page="site">⚙️ Site Settings</button>
      <button class="btn btn-secondary" onclick={() => { window.location.href = "/admin/"; }} data-page="profile">👤 Profile</button>
    </div>
  </div>

  <div class="card">
    <div class="card-title">About This Admin</div>
    <p class="text">
      This is a standalone admin panel built with Astro + Svelte. It connects directly to the GitHub API
      using your Personal Access Token (stored locally). Changes are committed directly to the repo.
    </p>
    <p class="text" style="margin-top:8px">
      <strong>Token required for:</strong> Creating/editing posts, updating config files.
      Without a token, you can only view the dashboard stats.
    </p>
  </div>
{/if}

<style>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
.stat-label { font-size: 0.8125rem; color: var(--text3); margin-bottom: 8px; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text); }
.card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.card-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 16px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: var(--accent); color: white; }
.btn-primary:hover { background: var(--accent2); }
.btn-secondary { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
.btn-secondary:hover { background: #475569; color: var(--text); }
.empty { text-align: center; padding: 48px 20px; color: var(--text3); }
.empty .spinner { width: 32px; height: 32px; margin-bottom: 16px; }
.text { font-size: 0.875rem; color: var(--text2); line-height: 1.6; }
.err { color: var(--danger); }
</style>
