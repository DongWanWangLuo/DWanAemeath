<script>
export let page = "dashboard";
export let mobileOpen = false;

function navItems() {
  return [
    { section: "Main" },
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "posts", icon: "📝", label: "Posts" },
    { section: "Configs" },
    { id: "site", icon: "⚙️", label: "Site Config" },
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "wallpaper", icon: "🖼️", label: "Wallpaper" },
    { id: "announcement", icon: "📢", label: "Announcement" },
    { id: "sidebar", icon: "📐", label: "Sidebar" },
    { section: "Content" },
    { id: "friends", icon: "🔗", label: "Friends" },
    { id: "music", icon: "🎵", label: "Music" },
  ];
}

$: items = navItems();
</script>

<div class="sidebar" class:open={mobileOpen}>
  <div class="sidebar-header">
    <h2>🛠️ Admin</h2>
    <p>DWan Blog v6.13</p>
  </div>
  <nav class="sidebar-nav">
    {#each items as item}
      {#if item.section}
        <div class="nav-section">{item.section}</div>
      {:else}
        <div class="nav-item" class:active={page === item.id} onclick={() => { $: page = item.id; }}>
          <span class="icon">{item.icon}</span>
          {item.label}
        </div>
      {/if}
    {/each}
  </nav>
  <div class="sidebar-footer">
    <button class="btn-logout" onclick={() => { localStorage.clear(); location.href = "/admin/login/"; }}>Logout</button>
  </div>
</div>

<style>
.sidebar { width: 240px; background: var(--bg2); border-right: 1px solid var(--border); position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; display: flex; flex-direction: column; transition: transform 0.3s; }
.sidebar.open { transform: translateX(0); }
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
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
}
</style>
