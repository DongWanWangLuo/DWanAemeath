<script lang="ts">
  import { getNavConfig, setNavConfig, cloneLinks, genId, addChild, removeChild, moveItem, updateItem, deleteItem, findItem } from '@/utils/navMenuConfig';
  import type { NavMenuItem } from '@/types/navMenuConfig';
  import { defaultNavItems } from '@/types/navMenuConfig';

  let links = [];
  let showAddModal = false;
  let editItem = null;
  let editChildParentId = '';
  let syncStatus = '';
  let syncLoading = false;
  let githubToken = '';
  let githubRepo = '';

  function init() {
    const stored = getNavConfig();
    if (stored) { links = cloneLinks(stored); }
    else { links = cloneLinks(defaultNavItems); }
    try { githubToken = localStorage.getItem("dw_admin_github_token") ?? ""; } catch(e) {}
    try { githubRepo = localStorage.getItem("dw_admin_github_repo") ?? ""; } catch(e) {}
  }


  function openAdd(parentId) {
    editItem = null;
    editChildParentId = parentId || '';
    showAddModal = true;
  }

  function openEdit(item) {
    editItem = JSON.parse(JSON.stringify(item));
    editChildParentId = '';
    showAddModal = true;
  }

  function saveItem() {
    if (!editItem) return;
    const newLinks = cloneLinks(links);
    if (editChildParentId) {
      var child = { id: genId('child'), name: editItem.name, url: editItem.url, icon: editItem.icon || '', pageKey: editItem.pageKey, external: editItem.external || false, enabled: editItem.enabled !== false };
      links = addChild(newLinks, editChildParentId, child);
    } else {
      if (editItem.id && findItem(newLinks, editItem.id)) {
        links = updateItem(newLinks, editItem.id, { name: editItem.name, url: editItem.url, icon: editItem.icon || '', pageKey: editItem.pageKey, external: editItem.external, enabled: editItem.enabled });
      } else {
        var newItem = { id: genId('item'), name: editItem.name, url: editItem.url, icon: editItem.icon || '', pageKey: editItem.pageKey, external: editItem.external || false, enabled: editItem.enabled !== false };
        links = [...newLinks, newItem];
      }
    }
    setNavConfig(links);
    showAddModal = false;
    editItem = null;
  }

  function deleteItemById(id) {
    if (!confirm('确定删除此项？')) return;
    links = deleteItem(cloneLinks(links), id);
    setNavConfig(links);
  }

  function moveUp(index) {
    if (index === 0) return;
    links = moveItem(cloneLinks(links), index, index - 1);
    setNavConfig(links);
  }

  function moveDown(index) {
    if (index >= links.length - 1) return;
    links = moveItem(cloneLinks(links), index, index + 1);
    setNavConfig(links);
  }

  async function syncToGitHub() {
    if (!githubToken || !githubRepo) { syncStatus = '请填写 GitHub Token 和仓库名'; return; }
    syncLoading = true;
    syncStatus = '同步中...';
    try {
      const res = await fetch('/api/nav-sync.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: githubToken, repo: githubRepo, config: { links } }) });
      const data = await res.json();
      syncStatus = data.ok ? '★ 同步成功！' : '☠ ' + (data.error || '同步失败');
    } catch (e) { syncStatus = '☠ 网络错误: ' + String(e); }
    finally { syncLoading = false; }
  }

  function loadFromGitHub() {
    if (!githubToken || !githubRepo) { syncStatus = '请先填写 GitHub Token 和仓库名'; return; }
    syncLoading = true;
    syncStatus = '加载中...';
    fetch('https://api.github.com/repos/' + githubRepo + '/contents/src/data/nav-config.json', { headers: { Authorization: 'Bearer ' + githubToken } })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.content) {
        var decoded = JSON.parse(atob(data.content));
        if (decoded.links) { links = cloneLinks(decoded.links); setNavConfig(links); syncStatus = '★ 已从 GitHub 加载'; }
      }
    })
    .catch(function(e) { syncStatus = '☠ 加载失败: ' + e.message; })
    .finally(function() { syncLoading = false; });
  }
</script>

<div class="nav-admin">
<div class="nav-header">
  <h3>导航栏管理</h3>
  <div class="nav-actions-bar">
    <button class="btn-add" on:click={() => openAdd()}>+ 添加菜单</button>
    <button class="btn-reset" on:click={() => { links = cloneLinks(defaultNavItems); setNavConfig(links); syncStatus = '已恢复默认'; }}>恢复默认</button>
  </div>
</div>

<div class="nav-list">
  {#each links as item, index (item.id)}
    <div class="nav-item-card" class:has-children={item.children && item.children.length > 0}>
      <div class="nav-item-left">
        {#if item.icon}
          <span class="nav-item-icon-name">{item.icon.split(':')[1] || item.icon}</span>
        {/if}
        <span class="nav-item-name">{item.name}</span>
        <span class="nav-item-url">{item.url}</span>
        {#if item.children && item.children.length > 0}
          <span class="child-count">{item.children.length} 个子菜单</span>
        {/if}
      </div>
      <div class="nav-item-controls">
        <button class="ctrl-btn" on:click={() => moveUp(index)} disabled={index === 0} title='上移'>↑</button>
        <button class="ctrl-btn" on:click={() => moveDown(index)} disabled={index === links.length - 1} title='下移'>↓</button>
        <button class="ctrl-btn edit" on:click={() => openEdit(item)} title='编辑'>✓</button>
        <button class="ctrl-btn add-child" on:click={() => openAdd(item.id)} title='添加子菜单'>+</button>
        <button class="ctrl-btn delete" on:click={() => deleteItemById(item.id)} title='删除'>🗑</button>
      </div>
      {#if item.children && item.children.length > 0}
        <div class="nav-children">
          {#each item.children as child, cidx (child.id)}
            <div class="nav-child-card">
              <div class="nav-item-left">
                {#if child.icon}
                  <span class="nav-item-icon-name">{child.icon.split(':')[1] || child.icon}</span>
                {/if}
                <span class="nav-item-name">{child.name}</span>
                <span class="nav-item-url">{child.url}</span>
              </div>
              <div class="nav-item-controls">
                <button class="ctrl-btn edit" on:click={() => { editItem = JSON.parse(JSON.stringify(child)); editChildParentId = item.id; showAddModal = true; }} title='编辑'>✓</button>
                <button class="ctrl-btn delete" on:click={() => { links = removeChild(cloneLinks(links), item.id, child.id); setNavConfig(links); }} title='删除'>🗑</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<div class="sync-section">
  <h4>同步到 GitHub</h4>
  <div class="setting-group">
    <label>GitHub Token</label>
    <input type="password" value={githubToken} on:input={(e) => { githubToken = e.target.value; }} placeholder="ghp_xxxxxxxxxxxx" />
  </div>
  <div class="setting-group">
    <label>仓库名</label>
    <input type="text" value={githubRepo} on:input={(e) => { githubRepo = e.target.value; }} placeholder="DongWanWangLuo/DWanAemeath" />
  </div>
  <div class="sync-buttons">
    <button class="btn-sync" on:click={syncToGitHub} disabled={syncLoading}>同步到 GitHub</button>
    <button class="btn-load" on:click={loadFromGitHub} disabled={syncLoading}>从 GitHub 加载</button>
  </div>
  <p class="sync-status">{syncStatus}</p>
</div>

{#if showAddModal}
  <div class="modal-overlay" on:click={(e) => { if (e.target === e.currentTarget) { showAddModal = false; editItem = null; } }}>
    <div class="modal">
      <h4>
        {editChildParentId ? '编辑子菜单' : (editItem && findItem(links, editItem.id) ? '编辑菜单' : '添加菜单')}
      </h4>
      <div class="form-group">
        <label>菜单名称</label>
        <input type="text" value={editItem.name} on:input={(e) => { editItem.name = e.target.value; }} placeholder="例如：关于" />
      </div>
      <div class="form-group">
        <label>链接 URL</label>
        <input type="text" value={editItem.url} on:input={(e) => { editItem.url = e.target.value; }} placeholder="/about/ 或 https://..." />
      </div>
      <div class="form-group">
        <label>图标</label>
        <input type="text" value={editItem.icon} on:input={(e) => { editItem.icon = e.target.value; }} placeholder="material-symbols:info" />
      </div>
      <div class="form-group">
        <label><input type="checkbox" checked={editItem.external} on:change={(e) => { editItem.external = e.target.checked; }} /> 外部链接</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" checked={editItem.enabled !== false} on:change={(e) => { editItem.enabled = e.target.checked; }} /> 启用</label>
      </div>
      <div class="modal-actions">
        <button class="btn-save" on:click={saveItem}>保存</button>
        <button class="btn-cancel" on:click={() => { showAddModal = false; editItem = null; }}>取消</button>
      </div>
    </div>
  </div>
{/if}
</div>

<style>
  .nav-admin { padding: 0; }

  .nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

  .nav-header h3 { margin: 0; font-size: 1.1rem; }

  .nav-actions-bar { display: flex; gap: 8px; }

  .btn-add { padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }

  .btn-add:hover { opacity: 0.85; }

  .btn-reset { padding: 8px 16px; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }

  .nav-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }

  .nav-item-card { background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; padding: 14px 16px; }

  .nav-item-card.has-children { border-left: 3px solid #6366f1; }

  .nav-item-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  .nav-item-icon-name { font-size: 0.75rem; background: #ede9fe; color: #7c3aed; padding: 2px 7px; border-radius: 6px; font-family: monospace; }

  .nav-item-name { font-weight: 600; color: var(--text-main, #1a1a1a); font-size: 0.95rem; }

  .nav-item-url { font-size: 0.8rem; color: var(--text-muted, #9ca3af); font-family: monospace; }

  .child-count { font-size: 0.75rem; background: #dbeafe; color: #2563eb; padding: 2px 8px; border-radius: 10px; }

  .nav-item-controls { display: flex; gap: 4px; margin-left: auto; }

  .ctrl-btn { width: 32px; height: 32px; border: 1px solid var(--border, #e5e7eb); background: var(--bg, #f9fafb); border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; }

  .ctrl-btn:hover:not(:disabled) { background: #eef2ff; border-color: #6366f1; }

  .ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ctrl-btn.edit:hover:not(:disabled) { background: #fef3c7; border-color: #f59e0b; }

  .ctrl-btn.delete:hover:not(:disabled) { background: #fef2f2; border-color: #ef4444; }

  .ctrl-btn.add-child:hover:not(:disabled) { background: #d1fae5; border-color: #10b981; }

  .nav-children { margin-top: 10px; padding-left: 24px; display: flex; flex-direction: column; gap: 6px; border-top: 1px dashed var(--border, #e5e7eb); padding-top: 10px; }

  .nav-child-card { background: var(--bg-alt, #f8fafc); border: 1px solid var(--border, #e5e7eb); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; }

  .sync-section { background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 12px; padding: 20px; margin-top: 8px; }

  .sync-section h4 { margin: 0 0 16px; font-size: 1rem; }

  .setting-group { margin-bottom: 14px; }

  .setting-group label { display: block; font-size: 0.8rem; color: var(--text-muted, #9ca3af); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 600; }

  .sync-buttons { display: flex; gap: 10px; margin-top: 12px; }

  .btn-sync { padding: 10px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }

  .btn-sync:hover:not(:disabled) { opacity: 0.9; }

  .btn-sync:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-load { padding: 10px 20px; background: #10b981; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }

  .btn-load:hover:not(:disabled) { opacity: 0.9; }

  .btn-load:disabled { opacity: 0.6; cursor: not-allowed; }

  .sync-status { margin-top: 10px; font-size: 0.85rem; color: #6b7280; min-height: 20px; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 10000; display: flex; align-items: center; justify-content: center; }

  .modal { background: var(--card-bg, #fff); border-radius: 16px; padding: 24px; width: 420px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }

  .modal h4 { margin: 0 0 20px; font-size: 1.1rem; }

  .form-group { margin-bottom: 14px; }

  .form-group label { display: block; font-size: 0.8rem; color: var(--text-muted, #9ca3af); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 600; }

  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

  .btn-save { padding: 10px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; }

  .btn-cancel { padding: 10px 24px; background: #f3f4f6; color: #374151; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; }

</style>
