<script>
import Sidebar from "./Sidebar.svelte";
import Dashboard from "./Dashboard.svelte";
import PostManager from "./PostManager.svelte";
import ConfigEditor from "./ConfigEditor.svelte";
import ProfileEditor from "./ProfileEditor.svelte";
import FriendsManager from "./FriendsManager.svelte";
import MusicManager from "./MusicManager.svelte";
import AnnouncementEditor from "./AnnouncementEditor.svelte";
import WallpaperEditor from "./WallpaperEditor.svelte";
import SidebarEditor from "./SidebarEditor.svelte";

let page = localStorage.getItem("admin_page") || "dashboard";
let token = localStorage.getItem("tk") || "";
let mobileOpen = false;
let loading = true;

export function navigate(p) {
  page = p;
  localStorage.setItem("admin_page", p);
  mobileOpen = false;
}

$: checked = token && token.length > 10;
$: needsToken = !checked;

if (!localStorage.getItem("s")) {
  window.location.href = "/admin/login/";
}

// Auto-load token on mount if available
if (typeof window !== "undefined") {
  token = localStorage.getItem("tk") || "";
  loading = false;
}
</script>

<div class="admin-root">
  <div class="sidebar-overlay" class:open={mobileOpen} onclick={() => mobileOpen = false} />
  <Sidebar bind:page bind:mobileOpen />

  <div class="main">
    <div class="topbar">
      <button class="mob-toggle" onclick={() => mobileOpen = !mobileOpen}>☰</button>
      <span class="topbar-title">{page}</span>
      <div class="topbar-right">
        {#if needsToken}
          <span class="badge warn">No GitHub Token</span>
        {:else}
          <span class="badge ok">Connected</span>
        {/if}
        <button class="btn-logout" onclick={() => { localStorage.clear(); location.href = "/admin/login/"; }}>Logout</button>
      </div>
    </div>
    <div class="content">
      {#if page === "dashboard"}<Dashboard {token} />
      {:else if page === "posts"}<PostManager {token} />
      {:else if page === "site"}<ConfigEditor {token} filePath="src/config/siteConfig.ts" name="Site Config" />
      {:else if page === "profile"}<ProfileEditor {token} />
      {:else if page === "friends"}<FriendsManager {token} />
      {:else if page === "music"}<MusicManager {token} />
      {:else if page === "announcement"}<AnnouncementEditor {token} />
      {:else if page === "wallpaper"}<WallpaperEditor {token} />
      {:else if page === "sidebar"}<SidebarEditor {token} />
      {/if}
    </div>
  </div>
</div>

<style>
.admin-root { display: flex; min-height: 100vh; position: relative; }
.sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 90; }
.sidebar-overlay.open { display: block; }
.sidebar { width: 240px; background: var(--bg2); border-right: 1px solid var(--border); position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; display: flex; flex-direction: column; transition: transform 0.3s; }
.sidebar-header { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); }
.sidebar-header h2 { font-size: 1.125rem; font-weight: 700; }
.sidebar-header p { font-size: 0.75rem; color: var(--text3); margin-top: 2px; }
.sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.nav-section { padding: 8px 20px 4px; font-size: 0.6875rem; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.05em; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 20px; cursor: pointer; color: var(--text2); font-size: 0.875rem; font-weight: 500; transition: all 0.15s; border-left: 3px solid transparent; }
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active { background: rgba(99,102,241,0.15); color: var(--accent); border-left-color: var(--accent); }
.nav-item .icon { font-size: 1.125rem; width: 20px; text-align: center; }
.sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); }
.btn-logout { width: 100%; padding: 8px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text2); font-size: 0.8125rem; cursor: pointer; transition: all 0.15s; }
.btn-logout:hover { background: var(--bg3); color: var(--text); }
.main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; min-height: 100vh; }
.topbar { height: 56px; background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; position: sticky; top: 0; z-index: 50; }
.topbar-title { font-size: 1rem; font-weight: 600; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.badge { font-size: 0.75rem; padding: 4px 10px; border-radius: 20px; font-weight: 500; }
.badge.ok { background: rgba(34,197,94,0.15); color: var(--success); }
.badge.warn { background: rgba(245,158,11,0.15); color: var(--warn); }
.mob-toggle { display: none; background: none; border: none; color: var(--text); font-size: 1.5rem; cursor: pointer; }
.content { flex: 1; padding: 24px; overflow-y: auto; animation: fadeIn 0.2s ease; }
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
  .main { margin-left: 0; }
  .mob-toggle { display: block; }
}
</style>
