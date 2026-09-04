<script>
export let page = "dashboard";
export let mobileOpen = false;

function navItems() {
  return [
    { section: "Main" },
    { id: "dashboard", icon: "\\ud83d\\udcca", label: "Dashboard" },
    { id: "posts", icon: "\\ud83d\\udcd5", label: "Posts" },
    { section: "Configs" },
    { id: "site", icon: "\\u2699\\ufe0f", label: "Site Config" },
    { id: "profile", icon: "\\ud83d\\udc64", label: "Profile" },
    { id: "wallpaper", icon: "\\ud83d\\uddbc\\ufe0f", label: "Wallpaper" },
    { id: "announcement", icon: "\\ud83d\\udce2", label: "Announcement" },
    { id: "sidebar", icon: "\\ud83d\\udcd0", label: "Sidebar" },
    { section: "Content" },
    { id: "friends", icon: "\\ud83d\\udd17", label: "Friends" },
    { id: "music", icon: "\\ud83c\\udfb5", label: "Music" },
  ];
}

$: items = navItems();

function handleNav(id) {
  page = id;
  mobileOpen = false;
}
</script>

<div class="sidebar" class:open={mobileOpen}>
  <div class="sidebar-header">
    <h2>"\\ud83d\\udee0\\ufe0f Admin"</h2>
    <p>DWan Blog v6.13</p>
  </div>
  <nav class="sidebar-nav">
    {#each items as item}
      {#if item.section}
        <div class="nav-section">{item.section}</div>
      {:else}
        <div class="nav-item" class:active={page === item.id} onclick={() => handleNav(item.id)}>
          <span class="icon">{item.icon}</span>
          {item.label}
        </div>
      {/if}
    {/each}
  </nav>
  <div class="sidebar-footer">
    <button class="btn-logout" onclick={() => { if (typeof localStorage !== "undefined") localStorage.clear(); window.location.href = "/admin/login/"; }}>Logout</button>
  </div>
</div>

<style>
.sidebar { width: 240px; background: #1e293b; border-right: 1px solid #334155; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; display: flex; flex-direction: column; transition: transform 0.3s; }
.sidebar.open { transform: translateX(0); }
.sidebar-header { padding: 20px 20px 16px; border-bottom: 1px solid #334155; }
.sidebar-header h2 { font-size: 1.125rem; font-weight: 700; color: #f1f5f9; }
.sidebar-header p { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
.sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.nav-section { padding: 8px 20px 4px; font-size: 0.6875rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 20px; cursor: pointer; color: #94a3b8; font-size: 0.875rem; font-weight: 500; transition: all 0.15s; border-left: 3px solid transparent; }
.nav-item:hover { background: #334155; color: #f1f5f9; }
.nav-item.active { background: rgba(99,102,241,0.15); color: #818cf8; border-left-color: #6366f1; }
.nav-item .icon { font-size: 1.125rem; width: 20px; text-align: center; }
.sidebar-footer { padding: 16px 20px; border-top: 1px solid #334155; }
.btn-logout { width: 100%; padding: 8px; background: transparent; border: 1px solid #334155; border-radius: 8px; color: #94a3b8; font-size: 0.8125rem; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.btn-logout:hover { background: #334155; color: #f1f5f9; }
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
}
</style>