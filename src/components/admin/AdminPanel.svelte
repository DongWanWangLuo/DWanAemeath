<script lang="ts">
  import * as adminConfig from "@/utils/adminConfig";

  let open = false;
  let activeTab = "appearance";
  let githubToken = "";
  let githubRepo = "";
  let syncStatus = { syncing: false, lastSync: null, error: null };
  let syncMessage = "";

  let hue = 240;
  let theme = null;
  let wallpaperMode = "fullscreen";
  let sakura = false;
  let waves = false;
  let gradient = false;
  let bannerTitle = false;
  let carousel = false;
  let postLayout = "grid";
  let categoryBar = true;
  let showTags = true;

  function loadSettings() {
    hue = adminConfig.getStoredHue();
    const t = adminConfig.getStoredTheme(); if (t) theme = t;
    wallpaperMode = adminConfig.getStoredWallpaperMode();
    sakura = adminConfig.getStoredSakuraEnabled();
    waves = adminConfig.getStoredWavesEnabled();
    gradient = adminConfig.getStoredGradientEnabled();
    bannerTitle = adminConfig.getStoredBannerTitleEnabled();
    carousel = adminConfig.getStoredCarouselEnabled();
    postLayout = adminConfig.getStoredPostLayout();
    categoryBar = adminConfig.getStoredCategoryBar();
    showTags = adminConfig.getStoredShowTags();
    githubToken = adminConfig.getGitHubToken();
    githubRepo = adminConfig.getGitHubRepo();
    const ss = adminConfig.getSyncStatus(); syncStatus = ss;
  }

  function toggleTab(tab) { activeTab = tab; open = true; }

  function syncToGitHub() {
    adminConfig.setGitHubToken(githubToken);
    adminConfig.setGitHubRepo(githubRepo);
    adminConfig.setSyncing(true);
    syncMessage = "同步中...";
    setTimeout(() => {
      adminConfig.setSyncing(false);
      adminConfig.setLastSync(new Date().toISOString());
      syncStatus = adminConfig.getSyncStatus();
      syncMessage = "同步完成（演示）";
    }, 1000);
  }
</script><div class="admin-overlay" class={open} on:click={|e| if (e.target === e.currentTarget) open = false}>
  <div class="admin-panel">
    <div class="admin-header">
      <h2>后台管理</h2>
      <button class="close-btn" on:click={open = false} aria-label="关闭">&times;</button>
    </div>
    <div class="admin-tabs">
      <button class="tab {activeTab === 'appearance'}" on:click={toggleTab('appearance')}>外观</button>
      <button class="tab {activeTab === 'wallpaper'}" on:click={toggleTab('wallpaper')}>壁纸</button>
      <button class="tab {activeTab === 'effects'}" on:click={toggleTab('effects')}>特效</button>
      <button class="tab {activeTab === 'settings'}" on:click={toggleTab('settings')}>设置</button>
      <button class="tab {activeTab === 'posts'}" on:click={toggleTab('posts')}>文章</button>
      <button class="tab {activeTab === 'github'}" on:click={toggleTab('github')}>同步</button>
    </div>
    <div class="admin-content">
      {#if activeTab === 'appearance'}
        <section>
          <h3>主题色</h3>
          <input type="range" min="0" max="360" bind:value={hue} on:input={|e| hue = Number(e.currentTarget.value); adminConfig.setStoredHue(hue)} />
          <span>{hue}</span>
          <h3>亮/暗色模式</h3>
          <select bind:value={theme} on:change={|e| theme = e.currentTarget.value; adminConfig.setStoredTheme(theme)}>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="system">跟随系统</option>
          </select>
        </section>
      {/if}
      {#if activeTab === 'wallpaper'}
        <section>
          <h3>壁纸模式</h3>
          <select bind:value={wallpaperMode} on:change={|e| wallpaperMode = e.currentTarget.value; adminConfig.setStoredWallpaperMode(wallpaperMode)}>
            <option value="banner">横幅壁纸</option>
            <option value="fullscreen">全屏壁纸</option>
            <option value="overlay">透明覆盖</option>
            <option value="none">纯色背景</option>
          </select>
        </section>
      {/if}
      {#if activeTab === 'effects'}
        <section>
          <h3>动画特效</h3>
          <label><input type="checkbox" bind:checked={sakura} on:change={|e| adminConfig.setStoredSakuraEnabled(sakura)} /> 樱花特效</label>
          <label><input type="checkbox" bind:checked={waves} on:change={|e| adminConfig.setStoredWavesEnabled(waves)} /> 水波纹动画</label>
          <label><input type="checkbox" bind:checked={gradient} on:change={|e| adminConfig.setStoredGradientEnabled(gradient)} /> 渐变过渡</label>
          <label><input type="checkbox" bind:checked={bannerTitle} on:change={|e| adminConfig.setStoredBannerTitleEnabled(bannerTitle)} /> 首页横幅标题</label>
          <label><input type="checkbox" bind:checked={carousel} on:change={|e| adminConfig.setStoredCarouselEnabled(carousel)} /> 壁纸轮播</label>
        </section>
      {/if}
      {#if activeTab === 'settings'}
        <section>
          <h3>文章布局</h3>
          <select bind:value={postLayout} on:change={|e| postLayout = e.currentTarget.value; adminConfig.setStoredPostLayout(postLayout)}>
            <option value="list">列表模式</option>
            <option value="grid">网格模式</option>
          </select>
          <label><input type="checkbox" bind:checked={categoryBar} on:change={|e| adminConfig.setStoredCategoryBar(categoryBar)} /> 分类导航栏</label>
          <label><input type="checkbox" bind:checked={showTags} on:change={|e| adminConfig.setStoredShowTags(showTags)} /> 文章列表显示标签</label>
        </section>
      {/if}
      {#if activeTab === 'posts'}
        <section>
          <h3>文章管理</h3>
          <p>文章内容存储在 <code>src/content/posts/</code> 目录下。</p>
          <p style="color:#888;font-size:0.85rem">通过 GitHub 同步后，可直接编辑本地 Markdown 文件后提交变更。</p>
          <p style="margin-top:16px"><strong>待开发：</strong>富文本编辑器集成（Vditor）</p>
        </section>
      {/if}
      {#if activeTab === 'github'}
        <section>
          <h3>GitHub 同步</h3>
          <p>填入 GitHub Token 和仓库信息以启用配置同步。</p>
          <input type="text" placeholder="GitHub Token" bind:value={githubToken} />
          <input type="text" placeholder="仓库名（如 DongWanWangLuo/DWanAemeath）" bind:value={githubRepo} />
          <button on:click={syncToGitHub}>同步到 GitHub</button>
          {#if syncMessage}<p>{syncMessage}</p>{/if}
          {#if syncStatus.error}<p class="error">{syncStatus.error}</p>{/if}
        </section>
      {/if}
    </div>
  </div>
</div>

<style>
  .admin-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.4); display: flex; align-items: stretch; justify-content: flex-end; }
  .admin-panel { width: 420px; max-width: 100%; height: 100%; background: var(--card-bg, #ffffff); color: var(--text-main, #1a1a1a); box-shadow: -4px 0 24px rgba(0,0,0,0.15); display: flex; flex-direction: column; animation: adminSlideIn 0.2s ease; }
  @keyframes adminSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .admin-header { padding: 16px 20px; border-bottom: 1px solid var(--border, #e5e7eb); display: flex; justify-content: space-between; align-items: center; }
  .admin-header h2 { margin: 0; font-size: 1.15rem; }
  .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-main); line-height: 1; }
  .admin-tabs { padding: 8px; display: flex; gap: 4px; border-bottom: 1px solid var(--border, #e5e7eb); overflow-x: auto; }
  .tab { padding: 6px 12px; border: none; background: transparent; cursor: pointer; border-radius: 6px; white-space: nowrap; font-size: 0.85rem; color: var(--text-secondary, #6b7280); }
  .tab.active { background: var(--primary, #6366f1); color: #fff; }
  .admin-content { flex: 1; overflow-y: auto; padding: 16px 20px; }
  section { margin-bottom: 28px; }
  section h3 { margin: 0 0 10px; font-size: 0.8rem; color: var(--text-muted, #9ca3af); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  input[type="range"] { width: 100%; accent-color: var(--primary, #6366f1); }
  select, input[type="text"] { width: 100%; padding: 8px 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; margin-bottom: 10px; background: var(--input-bg, #f9fafb); color: var(--text-main); }
  label { display: flex; align-items: center; gap: 8px; padding: 8px 0; cursor: pointer; font-size: 0.9rem; }
  button { padding: 10px; background: var(--primary, #6366f1); color: #fff; border: none; border-radius: 6px; cursor: pointer; width: 100%; margin-top: 8px; }
  .error { color: #dc2626; font-size: 0.85rem; margin-top: 8px; }
</style>