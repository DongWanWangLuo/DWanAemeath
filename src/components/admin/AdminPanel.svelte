<script lang="ts">
  import * as adminConfig from "@/utils/adminConfig";

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
  }

  function onHueInput(e) { hue = Number(e.target.value); adminConfig.setStoredHue(hue); }
  function onThemeChange(e) { theme = e.target.value; adminConfig.setStoredTheme(theme); }
  function onWallpaperModeChange(e) { wallpaperMode = e.target.value; adminConfig.setStoredWallpaperMode(wallpaperMode); }
  function onPostLayoutChange(e) { postLayout = e.target.value; adminConfig.setStoredPostLayout(postLayout); }
  function onSakuraChange(e) { sakura = e.target.checked; adminConfig.setStoredSakuraEnabled(sakura); }
  function onWavesChange(e) { waves = e.target.checked; adminConfig.setStoredWavesEnabled(waves); }
  function onGradientChange(e) { gradient = e.target.checked; adminConfig.setStoredGradientEnabled(gradient); }
  function onBannerTitleChange(e) { bannerTitle = e.target.checked; adminConfig.setStoredBannerTitleEnabled(bannerTitle); }
  function onCarouselChange(e) { carousel = e.target.checked; adminConfig.setStoredCarouselEnabled(carousel); }
  function onCategoryBarChange(e) { categoryBar = e.target.checked; adminConfig.setStoredCategoryBar(categoryBar); }
  function onShowTagsChange(e) { showTags = e.target.checked; adminConfig.setStoredShowTags(showTags); }

  function syncToGitHub() { alert("同步功能开发中..."); }
</script>
<div id="admin-panel-overlay" class="float-panel float-panel-closed absolute right-0 top-0 w-[420px] max-w-full h-full z-[9999] transition-all duration-200 ease-in-out">
  <div class="panel-body flex flex-col h-full">
    <div class="admin-header flex items-center justify-between px-5 py-4 border-b">
      <h2 class="m-0 text-lg font-semibold">后台管理</h2>
      <button class="close-btn" on:click={() => { var el = document.getElementById("admin-panel-overlay"); if(el) el.classList.add("float-panel-closed"); }} aria-label="关闭">&times;</button>
    </div>
    <div class="admin-tabs flex gap-1 px-3 py-2 border-b overflow-x-auto">
      <button class="tab-btn" data-tab="appearance">Appearance</button>
      <button class="tab-btn" data-tab="wallpaper">Wallpaper</button>
      <button class="tab-btn" data-tab="effects">Effects</button>
      <button class="tab-btn" data-tab="settings">Settings</button>
      <button class="tab-btn" data-tab="posts">Posts</button>
      <button class="tab-btn" data-tab="github">Github</button>
    </div>
    <div class="admin-content flex-1 overflow-y-auto px-5 py-4">
      <section id="tab-appearance" style="display:block">
        <h3>主题色</h3>
        <input type="range" min="0" max="360" value={hue} on:input={onHueInput} />
        <span>{hue}</span>
        <h3>亮/暗色模式</h3>
        <select value={theme} on:change={onThemeChange}>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="system">跟随系统</option>
        </select>
      </section>
      <section id="tab-wallpaper" style="display:none">
        <h3>壁纸模式</h3>
        <select value={wallpaperMode} on:change={onWallpaperModeChange}>
          <option value="banner">横幅壁纸</option>
          <option value="fullscreen">全屏壁纸</option>
          <option value="overlay">透明覆盖</option>
          <option value="none">纯色背景</option>
        </select>
      </section>
      <section id="tab-effects" style="display:none">
        <h3>动画特效</h3>
        <label><input type="checkbox" checked={sakura} on:change={onSakuraChange} /> 樱花特效</label>
        <label><input type="checkbox" checked={waves} on:change={onWavesChange} /> 水波纹动画</label>
        <label><input type="checkbox" checked={gradient} on:change={onGradientChange} /> 渐变过渡</label>
        <label><input type="checkbox" checked={bannerTitle} on:change={onBannerTitleChange} /> 首页横幅标题</label>
        <label><input type="checkbox" checked={carousel} on:change={onCarouselChange} /> 壁纸轮播</label>
      </section>
      <section id="tab-settings" style="display:none">
        <h3>文章布局</h3>
        <select value={postLayout} on:change={onPostLayoutChange}>
          <option value="list">列表模式</option>
          <option value="grid">网格模式</option>
        </select>
        <label><input type="checkbox" checked={categoryBar} on:change={onCategoryBarChange} /> 分类导航栏</label>
        <label><input type="checkbox" checked={showTags} on:change={onShowTagsChange} /> 文章列表显示标签</label>
      </section>
      <section id="tab-posts" style="display:none">
        <h3>文章管理</h3>
        <p>文章内容存储在 <code>src/content/posts/</code> 目录下。</p>
        <p style="color:#888;font-size:0.85rem">通过 GitHub 同步后，可直接编辑本地 Markdown 文件后提交变更。</p>
        <p style="margin-top:16px"><strong>待开发：</strong>富文本编辑器集成（Vditor）</p>
      </section>
      <section id="tab-github" style="display:none">
        <h3>GitHub 同步</h3>
        <p>填入 GitHub Token 和仓库信息以启用配置同步。</p>
        <input type="text" placeholder="GitHub Token" />
        <input type="text" placeholder="仓库名（如 DongWanWangLuo/DWanAemeath）" />
        <button on:click={syncToGitHub}>同步到 GitHub</button>
      </section>
    </div>
  </div>
</div>
<style>
  .admin-header { border-bottom: 1px solid var(--border, #e5e7eb); }
  .admin-header h2 { margin: 0; font-size: 1.15rem; color: var(--text-main, #1a1a1a); }
  .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-main, #1a1a1a); line-height: 1; }
  .close-btn:hover { opacity: 0.7; }
  .admin-tabs { border-bottom: 1px solid var(--border, #e5e7eb); }
  .tab-btn { padding: 6px 12px; border: none; background: transparent; cursor: pointer; border-radius: 6px; white-space: nowrap; font-size: 0.85rem; color: var(--text-secondary, #6b7280); }
  .tab-btn.active { background: var(--primary, #6366f1); color: #fff; }
  .admin-content section h3 { margin: 0 0 10px; font-size: 0.8rem; color: var(--text-muted, #9ca3af); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  input[type="range"] { width: 100%; accent-color: var(--primary, #6366f1); }
  select, input[type="text"] { width: 100%; padding: 8px 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; margin-bottom: 10px; background: var(--input-bg, #f9fafb); color: var(--text-main, #1a1a1a); box-sizing: border-box; }
  label { display: flex; align-items: center; gap: 8px; padding: 8px 0; cursor: pointer; font-size: 0.9rem; }
  button { padding: 10px; background: var(--primary, #6366f1); color: #fff; border: none; border-radius: 6px; cursor: pointer; width: 100%; margin-top: 8px; }
</style>