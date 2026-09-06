<script lang='ts'>
  import { onMount } from "svelte";
  import NavMenuAdmin from "./NavMenuAdmin.svelte";
  import { postToMarkdown, type DraftPost } from "@/utils/adminConfig";
  import { githubFileRequest } from "@/utils/githubClient";
  let allConfig: any = {};
  let activeTab = "site";
  let syncStatus = "";
  let syncLoading = false;
  let githubToken = "";
  let githubRepo = "";
  let saveStatus = "";
  let posts: any[] = [];
  let editingPost: any = null;
  let showPostEditor = false;
  let assetPath = "assets/images/wallpaper/";
  let assetFile: File | null = null;
  let assetLoading = false;
  let assetStatus = "";
  const tabs = [
    { id: "site", label: "网站设置" },
    { id: "effects", label: "特效控制" },
    { id: "wallpaper", label: "壁纸管理" },
    { id: "music", label: "背景音乐" },
    { id: "comment", label: "评论设置" },
    { id: "profile", label: "个人资料" },
    { id: "sidebar", label: "侧边栏" },
    { id: "font", label: "字体设置" },
    { id: "announcement", label: "公告设置" },
    { id: "analytics", label: "分析统计" },
    { id: "cover", label: "封面图片" },
    { id: "portfolio", label: "作品集" },
    { id: "pio", label: "Spine角色" },
    { id: "plantuml", label: "PlantUML" },
    { id: "sponsor", label: "打赏设置" },
    { id: "license", label: "版权设置" },
    { id: "gallery", label: "相册设置" },
    { id: "assets", label: "资源上传" },
    { id: "posts", label: "文章管理" },
    { id: "nav", label: "导航栏" },
    { id: "sync", label: "数据同步" },
  ];

  async function loadAllConfigs() {
    try {
      const res = await fetch("/api/configs.json");
      if (!res.ok) { syncStatus = "找不到配置文件"; return; }
      const serverConfig = await res.json();
      const localConfig = localStorage.getItem("dw_all_configs");
      allConfig = localConfig ? JSON.parse(localConfig) : serverConfig;
    } catch (e) { syncStatus = "请求失败: " + e.message; }
  }
  function getVal(path) { const keys = path.split("."); let cur = allConfig; for (const k of keys) { if (cur == null) return undefined; cur = cur[k]; } return cur; }
  function setVal(path, value) {
    const keys = path.split(".");
    let cur = allConfig;
    for (let i = 0; i < keys.length - 1; i++) { if (!cur[keys[i]]) cur[keys[i]] = {}; cur = cur[keys[i]]; }
    const current = cur[keys[keys.length - 1]];
    cur[keys[keys.length - 1]] = typeof current === "number" ? Number(value) : value;
    allConfig = { ...allConfig };
  }
  function updateArrayItem(path, index, key, value) {
    const items = Array.isArray(getVal(path)) ? [...getVal(path)] : [];
    items[index] = { ...items[index], [key]: value };
    setVal(path, items);
  }
  function addArrayItem(path, value = "") {
    const items = Array.isArray(getVal(path)) ? [...getVal(path)] : [];
    setVal(path, [...items, value]);
  }
  function removeArrayItem(path, index) {
    const items = Array.isArray(getVal(path)) ? [...getVal(path)] : [];
    setVal(path, items.filter((_, itemIndex) => itemIndex !== index));
  }
  function assetRepoPath(value) {
    const path = String(value || '').split(/[?#]/, 1)[0].replace(/^\/+/, '');
    if (path.startsWith('src/') || path.startsWith('public/')) return path;
    if (String(value || '').startsWith('/')) return 'public/' + path;
    return 'src/' + path;
  }
  async function replaceAsset(path, event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const setAssetStatus = (message) => { assetStatus = message; saveStatus = message; };
    if (!path) { setAssetStatus('当前资源没有路径，无法替换'); return; }
    if (!githubToken || !githubRepo) { setAssetStatus('请先在“数据同步”中填写 GitHub Token 和仓库名'); return; }
    if (file.size > 8 * 1024 * 1024) { setAssetStatus('文件不能超过 8 MB'); return; }
    setAssetStatus('正在替换资源，请稍候...');
    try {
      const buffer = await file.arrayBuffer();
      let binary = '';
      for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
      const result = await githubFileRequest({ token: githubToken, repo: githubRepo, action: 'write', path: assetRepoPath(path), encodedContent: btoa(binary), message: 'chore: replace asset ' + path });
      if (!result.ok) throw new Error(result.error || '替换失败');
      const previewUrl = URL.createObjectURL(file);
      document.querySelectorAll(`[src="${CSS.escape(path)}"]`).forEach((element) => { element.setAttribute('src', previewUrl); });
      setAssetStatus('资源已替换，重新构建后生效');
    } catch (error) { setAssetStatus('替换失败: ' + String(error)); }
  }
  function getPostFolderName(title, fallback) {
    const folderName = String(title || "").trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ");
    return folderName || fallback;
  }
  function toggleBool(path) { const c = getVal(path); setVal(path, !c); }
  function saveToLocal() { try { localStorage.setItem("dw_all_configs", JSON.stringify(allConfig)); saveStatus = "保存成功！重新加载网页后生效"; setTimeout(() => { saveStatus = ""; }, 3000); } catch(e) { saveStatus = "保存失败: " + e.message; } }
  async function syncToGitHub() {
    if (!githubToken || !githubRepo) { syncStatus = "请先填写 GitHub Token 和仓库名"; return; }
    syncLoading = true; syncStatus = "同步中...";
    saveToLocal();
    sessionStorage.setItem("dw_admin_github_token", githubToken); sessionStorage.setItem("dw_admin_github_repo", githubRepo);
    try {
      const result = await githubFileRequest({ token: githubToken, repo: githubRepo, action: "write", path: "src/data/all-configs.json", content: JSON.stringify(allConfig, null, 2), message: "chore: sync admin config from panel" });
      if (result.ok) { syncStatus = "同步成功！配置已推送到 GitHub。"; } else { syncStatus = "同步失败: " + (result.error || "未知错误"); }
    } catch(e) { syncStatus = "请求失败: " + e.message; } finally { syncLoading = false; }
  }
  function exportConfig() { const blob = new Blob([JSON.stringify(allConfig, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "dwan-config-" + new Date().toISOString().slice(0,10) + ".json"; a.click(); URL.revokeObjectURL(url); }
  function importConfig(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(ev) { try { allConfig = JSON.parse(ev.target.result); saveStatus = "导入成功！请点击保存。"; } catch(err) { saveStatus = "文件格式错误"; } }; reader.readAsText(file); e.target.value = ""; }
  async function loadPosts() {
    try { const res = await fetch("/api/allPostMeta.json"); if (res.ok) { const data = await res.json(); posts = (data.posts || data).map(function(p) { return { slug: p.id || p.slug || p.fileSlug, sourceFile: p.sourceFile || "", title: p.frontmatter?.title || p.title || p.id || p.slug, description: p.frontmatter?.description || p.description || "", category: p.frontmatter?.category || p.category || "", tags: p.frontmatter?.tags || p.tags || [], published: p.frontmatter?.published || (p.published ? new Date(p.published).toISOString().slice(0, 10) : ""), draft: p.frontmatter?.draft === true || p.draft === true, cover: p.frontmatter?.image || p.image || "" }; }); } } catch(e) { posts = []; }
  }
  async function openEditPost(post) {
    editingPost = JSON.parse(JSON.stringify(post));
    showPostEditor = true;
    if (!editingPost.sourceFile || !githubToken || !githubRepo) return;
    saveStatus = "正在读取文章正文...";
    try {
      const result = await githubFileRequest({ token: githubToken, repo: githubRepo, action: "read", path: editingPost.sourceFile });
      if (!result.ok) throw new Error(result.error || "读取文章失败");
      editingPost = { ...editingPost, content: result.content || "" };
      saveStatus = "文章正文已加载";
    } catch (e) { saveStatus = "读取失败: " + String(e); }
  }
  function closePostEditor() { showPostEditor = false; editingPost = null; }
  async function savePost() {
    if (!editingPost) return;
    if (!githubToken || !githubRepo) { saveStatus = "请先在数据同步中填写 GitHub Token 和仓库名"; return; }
    const sourceFile = editingPost.sourceFile || "src/content/posts/" + getPostFolderName(editingPost.title, editingPost.slug) + "/index.md";
    const draft: DraftPost = { id: editingPost.slug, title: editingPost.title, description: editingPost.description, content: editingPost.content || "", image: editingPost.cover, tags: editingPost.tags || [], category: editingPost.category || "", published: editingPost.published, draft: editingPost.draft };
    saveStatus = "正在提交文章...";
    try {
      const result = await githubFileRequest({ token: githubToken, repo: githubRepo, action: "write", path: sourceFile, content: postToMarkdown(draft), message: "chore: update post " + editingPost.slug });
      if (!result.ok) throw new Error(result.error || "保存失败");
      editingPost.sourceFile = sourceFile;
      const idx = posts.findIndex(function(p){ return p.slug === editingPost.slug; });
      if (idx >= 0) posts[idx] = { ...editingPost }; else posts = [...posts, { ...editingPost }];
      saveStatus = "文章已提交到 GitHub，重新构建后生效";
      setTimeout(() => { saveStatus = ""; showPostEditor = false; }, 1800);
    } catch (e) { saveStatus = "保存失败: " + String(e); }
  }
  async function deletePost(slug) {
    const post = posts.find(function(p) { return p.slug === slug; });
    if (!post || !confirm("确定删除这篇文章？此操作会删除 GitHub 中的文件。")) return;
    if (!githubToken || !githubRepo || !post.sourceFile) { saveStatus = "缺少 GitHub 配置或文章源文件路径"; return; }
    try {
      const result = await githubFileRequest({ token: githubToken, repo: githubRepo, action: "delete", path: post.sourceFile, message: "chore: delete post " + slug });
      if (!result.ok) throw new Error(result.error || "删除失败");
      posts = posts.filter(function(p){ return p.slug !== slug; });
      saveStatus = "文章已从 GitHub 删除";
    } catch (e) { saveStatus = "删除失败: " + String(e); }
  }
  function createNewPost() { editingPost = { slug: "new-post-" + Date.now(), sourceFile: "", title: "新文章", description: "", category: "", tags: [], published: new Date().toISOString().slice(0,10), draft: false, cover: "", content: "" }; showPostEditor = true; }

  async function uploadAsset() {
    if (!assetFile) { assetStatus = "请选择文件"; return; }
    if (!githubToken || !githubRepo) { assetStatus = "请先填写 GitHub Token 和仓库名"; return; }
    if (assetFile.size > 8 * 1024 * 1024) { assetStatus = "文件不能超过 8 MB"; return; }
    const path = assetPath.replace(/\\/g, "/").replace(/\/$/, "") + "/" + assetFile.name;
    assetLoading = true;
    assetStatus = "正在上传...";
    try {
      const buffer = await assetFile.arrayBuffer();
      let binary = "";
      for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
      const result = await githubFileRequest({ token: githubToken, repo: githubRepo, action: "write", path: path.startsWith("public/") ? path : "public/" + path, encodedContent: btoa(binary), message: "chore: upload asset " + path });
      if (!result.ok) throw new Error(result.error || "上传失败");
      assetStatus = "上传成功：" + path;
    } catch (e) { assetStatus = "上传失败: " + String(e); }
    finally { assetLoading = false; }
  }

  onMount(() => {
    const session = Number(sessionStorage.getItem("dw_admin_session"));
    if (!Number.isFinite(session) || session <= Date.now()) {
      sessionStorage.removeItem("dw_admin_session");
      window.location.replace("/admin-login");
      return;
    }
    loadAllConfigs();
    loadPosts();
  });

  try { const t = sessionStorage.getItem("dw_admin_github_token"); if(t) githubToken = t; const r = sessionStorage.getItem("dw_admin_github_repo"); if(r) githubRepo = r; } catch(e) {}
</script>

  <div class="admin-full">
  <aside class="admin-sidebar">
    <div class="admin-logo">DWan博客后台</div>
    <nav class="admin-tabs" aria-label="后台功能">
      {#each tabs as tab}
        <button class:active={activeTab === tab.id} class="tab-btn" on:click={() => activeTab = tab.id}>{tab.label}</button>
      {/each}
    </nav>
    <div class="admin-actions">
      <button class="action-btn save-btn" on:click={saveToLocal}>保存本地配置</button>
      <button class="action-btn" on:click={exportConfig}>导出配置</button>
      <button class="action-btn" on:click={() => { sessionStorage.removeItem("dw_admin_session"); sessionStorage.removeItem("dw_admin_github_token"); sessionStorage.removeItem("dw_admin_github_repo"); window.location.replace("/admin-login"); }}>退出登录</button>
      <a class="back-link" href="/">返回网站</a>
    </div>
    <div class="status-bar" aria-live="polite">{saveStatus}</div>
  </aside>
  <div class="admin-content">
    {#if activeTab === "site"}
      <div class="tab-panel">
        <h3>网站基本信息</h3>
        <div class="field-group"><label>网站标题</label><input type="text" value={getVal('site.title') ?? ''} on:input={(e)=>setVal('site.title',e.target.value)} /></div>
        <div class="field-group"><label>子标题</label><input type="text" value={getVal('site.subtitle') ?? ''} on:input={(e)=>setVal('site.subtitle',e.target.value)} /></div>
        <div class="field-group"><label>网站描述</label><textarea rows="3" on:input={(e)=>setVal('site.description',e.target.value)}>{getVal('site.description') ?? ''}</textarea></div>
        <div class="field-group"><label>网站地址</label><input type="text" value={getVal('site.site_url') ?? ''} on:input={(e)=>setVal('site.site_url',e.target.value)} /></div>
        <div class="field-group"><label>主题版本</label><input type="text" value={getVal('site.themeVersion') ?? ''} on:input={(e)=>setVal('site.themeVersion',e.target.value)} /></div>
        <div class="field-group"><label>网站开始日期</label><input type="date" value={getVal('site.siteStartDate') ?? ''} on:input={(e)=>setVal('site.siteStartDate',e.target.value)} /></div>
        <h3>主题色调</h3>
        <div class="field-group"><label>色相值 (0-360)</label><input type="range" min="0" max="360" value={getVal('site.themeColor.hue') ?? 240} on:input={(e)=>setVal('site.themeColor.hue',e.target.value)} /><span>{allConfig.site?.themeColor?.hue}</span></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.site?.themeColor?.fixed} on:change={(e)=>setVal('site.themeColor.fixed',e.target.checked)} /> 固定色相</label></div>
        <div class="field-group"><label>默认模式</label><select value={getVal('site.themeColor.defaultMode') ?? 'system'} on:change={(e)=>setVal('site.themeColor.defaultMode',e.target.value)}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></div>
        <h3>首页页面设置</h3>
        <div class="field-group"><label>屏幕宽度 (%)</label><input type="number" value={getVal('site.pageWidth') ?? ''} on:input={(e)=>setVal('site.pageWidth',e.target.value)} /></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.site?.categoryBar} on:change={(e)=>setVal('site.categoryBar',e.target.checked)} /> 分类导航栏</label></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.site?.foldArticle} on:change={(e)=>setVal('site.foldArticle',e.target.checked)} /> 文章折叠</label></div>
        <h3>功能页面</h3>
        <div class="fields-row">
          <label><input type="checkbox" checked={allConfig.site?.pages?.friends} on:change={(e)=>setVal('site.pages.friends',e.target.checked)} /> friends</label>
          <label><input type="checkbox" checked={allConfig.site?.pages?.sponsor} on:change={(e)=>setVal('site.pages.sponsor',e.target.checked)} /> sponsor</label>
          <label><input type="checkbox" checked={allConfig.site?.pages?.guestbook} on:change={(e)=>setVal('site.pages.guestbook',e.target.checked)} /> guestbook</label>
          <label><input type="checkbox" checked={allConfig.site?.pages?.bangumi} on:change={(e)=>setVal('site.pages.bangumi',e.target.checked)} /> bangumi</label>
          <label><input type="checkbox" checked={allConfig.site?.pages?.gallery} on:change={(e)=>setVal('site.pages.gallery',e.target.checked)} /> gallery</label>
          <label><input type="checkbox" checked={allConfig.site?.pages?.anime} on:change={(e)=>setVal('site.pages.anime',e.target.checked)} /> anime</label>
        </div>
        <h3>文章列表设置</h3>
        <div class="field-group"><label>默认布局</label><select value={getVal('site.postListLayout.defaultMode') ?? 'grid'} on:change={(e)=>setVal('site.postListLayout.defaultMode',e.target.value)}><option value="grid">网格</option><option value="list">列表</option></select></div>
        <div class="fields-row"><label><input type="checkbox" checked={allConfig.site?.postListLayout?.showTags} on:change={(e)=>setVal('site.postListLayout.showTags',e.target.checked)} /> 显示标签</label><label><input type="checkbox" checked={allConfig.site?.postListLayout?.allowSwitch} on:change={(e)=>setVal('site.postListLayout.allowSwitch',e.target.checked)} /> 允许切换布局</label></div>
        <div class="field-group"><label>每页文章数</label><input type="number" value={getVal('site.pagination.postsPerPage') ?? ''} on:input={(e)=>setVal('site.pagination.postsPerPage',e.target.value)} /></div>
        <h3>番组计划</h3>
        <div class="field-group"><label>Bangumi 用户ID</label><input type="text" value={getVal('site.bangumi.userId') ?? ''} on:input={(e)=>setVal('site.bangumi.userId',e.target.value)} /></div>
        <div class="field-group"><label>Bilibili UID</label><input type="text" value={getVal('site.anime.bilibili.uid') ?? ''} on:input={(e)=>setVal('site.anime.bilibili.uid',e.target.value)} /></div>
        <h3>网站品牌图片</h3>
        <div class="field-group"><label>导航栏 Logo</label><div class="brand-preview-row"><img src={getVal('site.navbar.logo.value') ?? ''} alt="网站 Logo" class="brand-preview logo-preview" /><div class="brand-fields"><input type="text" value={getVal('site.navbar.logo.value') ?? ''} on:input={(e)=>setVal('site.navbar.logo.value',e.target.value)} /><label class="replace-btn">替换 Logo<input type="file" accept="image/*" on:change={(e)=>replaceAsset(getVal('site.navbar.logo.value'),e)} /></label></div></div></div>
        <h3>网站图标 Favicon</h3>
        <div class="media-grid favicon-grid">{#each (allConfig.site?.favicon || []) as icon, i}<div class="media-card"><img src={icon.src} alt={'Favicon ' + (i + 1)} loading="lazy" /><input type="text" value={icon.src} on:input={(e)=>updateArrayItem('site.favicon', i, 'src', e.target.value)} /><label class="replace-btn">替换图标<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" on:change={(e)=>replaceAsset(icon.src,e)} /></label></div>{/each}</div>
        <div class="save-notice">修改后请点击保存，再点击同步到 GitHub 生效</div>
      </div>
    {/if}
    {#if activeTab === "effects"}
      <div class="tab-panel">
        <h3>动画特效控制</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.effects?.enable} on:change={(e)=>setVal('effects.enable',e.target.checked)} /> 整体特效开关</label></div>
        <h3>樱花特效</h3>
        <div class="field-group"><label>樱花数量</label><input type="number" value={getVal('effects.sakuraNum') ?? ''} on:input={(e)=>setVal('effects.sakuraNum',e.target.value)} /></div>
        <div class="field-group"><label>大小范围</label><div class="range-pair"><input type="number" step="0.1" value={getVal('effects.size.min')} on:input={(e)=>setVal('effects.size.min',e.target.value)} /><input type="number" step="0.1" value={getVal('effects.size.max')} on:input={(e)=>setVal('effects.size.max',e.target.value)} /></div></div>
        <div class="field-group"><label>透明度范围</label><div class="range-pair"><input type="number" step="0.1" value={getVal('effects.opacity.min')} on:input={(e)=>setVal('effects.opacity.min',e.target.value)} /><input type="number" step="0.1" value={getVal('effects.opacity.max')} on:input={(e)=>setVal('effects.opacity.max',e.target.value)} /></div></div>
        <h3>水波纹动画</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.wallpaper?.common?.waves?.enable?.desktop} on:change={(e)=>setVal('wallpaper.common.waves.enable.desktop',e.target.checked)} /> 水波纹开关</label></div>
        <h3>渐变过渡</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.wallpaper?.common?.gradient?.enable?.desktop} on:change={(e)=>setVal('wallpaper.common.gradient.enable.desktop',e.target.checked)} /> 渐变过渡开关</label></div>
        <h3>首页横幅标题</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.wallpaper?.common?.homeText?.enable} on:change={(e)=>setVal('wallpaper.common.homeText.enable',e.target.checked)} /> 首页标题显示</label></div>
        <h3>轮播模式</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.wallpaper?.common?.carousel?.enable} on:change={(e)=>setVal('wallpaper.common.carousel.enable',e.target.checked)} /> 背景轮播开关</label></div>
        <div class="save-notice">修改后请点击保存，再点击同步到 GitHub 生效</div>
      </div>
    {/if}
    {#if activeTab === "wallpaper"}
      <div class="tab-panel">
        <h3>背景壁纸</h3>
        <div class="field-group"><label>壁纸模式</label><select value={getVal('wallpaper.mode') ?? 'fullscreen'} on:change={(e)=>setVal('wallpaper.mode',e.target.value)}><option value="fullscreen">全屏</option><option value="banner">横幅</option><option value="overlay">透明覆盖</option><option value="none">纯色背景</option></select></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.wallpaper?.switchable} on:change={(e)=>setVal('wallpaper.switchable',e.target.checked)} /> 允许用户切换背景</label></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.wallpaper?.playerEnable} on:change={(e)=>setVal('wallpaper.playerEnable',e.target.checked)} /> 显示背景播放器</label></div>
        <p class="note">点击图片可预览；“替换”会覆盖当前 GitHub 路径中的文件。</p>
        <h3>桌面背景图</h3>
        <div class="media-grid">
          {#each (allConfig.wallpaper?.src?.desktop || []) as url, i}
            <div class="media-card"><img src={url} alt={'桌面壁纸 ' + (i + 1)} loading="lazy" on:error={(e)=>e.currentTarget.style.opacity='0.35'} /><input type="text" value={url} on:input={(e)=>{ const items=[...(allConfig.wallpaper?.src?.desktop || [])]; items[i]=e.target.value; setVal('wallpaper.src.desktop',items); }} /><div class="media-actions"><label class="replace-btn">替换<input type="file" accept="image/*" on:change={(e)=>replaceAsset(url,e)} /></label><button class="mini-delete" on:click={()=>removeArrayItem('wallpaper.src.desktop', i)}>删除</button></div></div>
          {/each}
        </div>
        <button class="inline-add" on:click={()=>addArrayItem('wallpaper.src.desktop')}>添加桌面壁纸</button>
        <h3>移动背景图</h3>
        <div class="media-grid">
          {#each (allConfig.wallpaper?.src?.mobile || []) as url, i}
            <div class="media-card"><img src={url} alt={'移动壁纸 ' + (i + 1)} loading="lazy" on:error={(e)=>e.currentTarget.style.opacity='0.35'} /><input type="text" value={url} on:input={(e)=>{ const items=[...(allConfig.wallpaper?.src?.mobile || [])]; items[i]=e.target.value; setVal('wallpaper.src.mobile',items); }} /><div class="media-actions"><label class="replace-btn">替换<input type="file" accept="image/*" on:change={(e)=>replaceAsset(url,e)} /></label><button class="mini-delete" on:click={()=>removeArrayItem('wallpaper.src.mobile', i)}>删除</button></div></div>
          {/each}
        </div>
        <button class="inline-add" on:click={()=>addArrayItem('wallpaper.src.mobile')}>添加移动壁纸</button>
        <h3>背景视频</h3>
        <div class="media-grid video-grid">
          {#each (allConfig.wallpaper?.src?.playerUrl || []) as url, i}
            <div class="media-card"><video src={url} controls muted preload="metadata"></video><input type="text" value={url} on:input={(e)=>{ const items=[...(allConfig.wallpaper?.src?.playerUrl || [])]; items[i]=e.target.value; setVal('wallpaper.src.playerUrl',items); }} /><div class="media-actions"><label class="replace-btn">替换<input type="file" accept="video/*" on:change={(e)=>replaceAsset(url,e)} /></label><button class="mini-delete" on:click={()=>removeArrayItem('wallpaper.src.playerUrl', i)}>删除</button></div></div>
          {/each}
        </div>
        <button class="inline-add" on:click={()=>addArrayItem('wallpaper.src.playerUrl')}>添加视频地址</button>
        <div class="save-notice">修改后请点击保存并同步。删除地址不会删除实际图片文件。</div>
      </div>
    {/if}
    {#if activeTab === "music"}
      <div class="tab-panel">
        <h3>背景音乐</h3>
        <div class="field-group"><label>音乐模式</label><select value={getVal('music.mode') ?? 'local'} on:change={(e)=>setVal('music.mode',e.target.value)}><option value="local">本地歌单</option><option value="meting">Meting API</option></select></div>
        <div class="fields-row"><div class="field-group"><label><input type="checkbox" checked={allConfig.music?.showInNavbar !== false} on:change={(e)=>setVal('music.showInNavbar',e.target.checked)} /> 导航栏显示播放器</label></div><div class="field-group"><label>音量 (0-1)</label><input type="number" min="0" max="1" step="0.05" value={getVal('music.volume') ?? 0.7} on:input={(e)=>setVal('music.volume',e.target.value)} /></div></div>
        <div class="field-group"><label>播放模式</label><select value={getVal('music.playMode') ?? 'list'} on:change={(e)=>setVal('music.playMode',e.target.value)}><option value="list">列表循环</option><option value="one">单曲循环</option><option value="random">随机播放</option></select></div>
        {#if allConfig.music?.mode === 'meting'}
          <div class="fields-row"><div class="field-group"><label>平台</label><input type="text" value={getVal('music.meting.server') ?? ''} on:input={(e)=>setVal('music.meting.server',e.target.value)} /></div><div class="field-group"><label>类型</label><input type="text" value={getVal('music.meting.type') ?? ''} on:input={(e)=>setVal('music.meting.type',e.target.value)} /></div></div>
          <div class="field-group"><label>歌单/歌曲 ID</label><input type="text" value={getVal('music.meting.id') ?? ''} on:input={(e)=>setVal('music.meting.id',e.target.value)} /></div>
        {:else}
          <div class="field-group"><label>本地歌单</label><div class="music-list">{#each (allConfig.music?.local?.playlist || []) as song, i}<div class="music-card">{#if song.cover}<img src={song.cover} alt={song.name} loading="lazy" />{:else}<div class="music-placeholder">♪</div>{/if}<div class="music-info"><strong>{song.name || '未命名歌曲'}</strong><span>{song.artist || '未知艺术家'}</span><input type="text" value={song.url} on:input={(e)=>updateArrayItem('music.local.playlist', i, 'url', e.target.value)} /><audio src={song.url} controls preload="none"></audio></div><label class="replace-btn">替换音频<input type="file" accept="audio/*" on:change={(e)=>replaceAsset(song.url,e)} /></label></div>{/each}</div><textarea rows="8" value={JSON.stringify(getVal('music.local.playlist') ?? [], null, 2)} on:change={(e)=>{ try { setVal('music.local.playlist', JSON.parse(e.target.value)); saveStatus = '歌单 JSON 已更新'; } catch { saveStatus = '歌单 JSON 格式错误'; } }}></textarea><p class="note">每项使用 name、artist、url、cover、lrc 字段。</p></div>
        {/if}
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "comment"}
      <div class="tab-panel">
        <h3>评论系统</h3>
        <div class="field-group"><label>评论插件</label><select value={getVal('comment.type') ?? 'none'} on:change={(e)=>setVal('comment.type',e.target.value)}><option value="none">关闭</option><option value="twikoo">Twikoo</option><option value="waline">Waline</option><option value="giscus">Giscus</option><option value="artalk">Artalk</option><option value="disqus">Disqus</option></select></div>
        <div class="field-group"><label>Twikoo 地址</label><input type="text" value={getVal('comment.twikoo.envId') ?? ''} on:input={(e)=>setVal('comment.twikoo.envId',e.target.value)} placeholder="https://twikoo.example.com" /></div>
        <div class="field-group"><label>Waline 服务器地址</label><input type="text" value={getVal('comment.waline.serverURL') ?? ''} on:input={(e)=>setVal('comment.waline.serverURL',e.target.value)} /></div>
        <div class="field-group"><label>Artalk 服务器地址</label><input type="text" value={getVal('comment.artalk.server') ?? ''} on:input={(e)=>setVal('comment.artalk.server',e.target.value)} /></div>
        <div class="field-group"><label>Giscus 参数</label><input type="text" value={getVal('comment.giscus.repo') ?? ''} on:input={(e)=>setVal('comment.giscus.repo',e.target.value)} placeholder="仓库名" style="margin-bottom:8px"/><input type="text" value={getVal('comment.giscus.repoId') ?? ''} on:input={(e)=>setVal('comment.giscus.repoId',e.target.value)} placeholder="repo ID" /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "profile"}
      <div class="tab-panel">
        <h3>个人资料</h3>
        <div class="field-group"><label>主页头像</label><div class="brand-preview-row"><img src={getVal('profile.avatar') ?? ''} alt="主页头像" class="brand-preview avatar-preview" /><div class="brand-fields"><input type="text" value={getVal('profile.avatar') ?? ''} on:input={(e)=>setVal('profile.avatar',e.target.value)} /><label class="replace-btn">替换头像<input type="file" accept="image/*" on:change={(e)=>replaceAsset(getVal('profile.avatar'),e)} /></label></div></div></div>
        <div class="field-group"><label>姓名</label><input type="text" value={getVal('profile.name') ?? ''} on:input={(e)=>setVal('profile.name',e.target.value)} /></div>
        <div class="field-group"><label>个人简介</label><textarea rows="3" on:input={(e)=>setVal('profile.bio',e.target.value)}>{getVal('profile.bio') ?? ''}</textarea></div>
        <h3>社交链接</h3>
        {#each (allConfig.profile?.links || []) as link, i}
          <div class="fields-row profile-link-row"><div class="field-group"><label>名称</label><input type="text" value={link.name} on:input={(e)=>updateArrayItem('profile.links', i, 'name', e.target.value)} /></div><div class="field-group"><label>图标</label><input type="text" value={link.icon} on:input={(e)=>updateArrayItem('profile.links', i, 'icon', e.target.value)} /></div><div class="field-group"><label>地址</label><input type="text" value={link.url} on:input={(e)=>updateArrayItem('profile.links', i, 'url', e.target.value)} /></div><label><input type="checkbox" checked={link.showName === true} on:change={(e)=>updateArrayItem('profile.links', i, 'showName', e.target.checked)} /> 显示名称</label></div>
        {/each}
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "sidebar"}
      <div class="tab-panel">
        <h3>侧边栏设置</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.sidebar?.card?.enable !== false} on:change={(e)=>setVal('sidebar.card.enable',e.target.checked)} /> 侧边栏卡片</label></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.sidebar?.top?.enable !== false} on:change={(e)=>setVal('sidebar.top.enable',e.target.checked)} /> 顶部信息卡片</label></div>
        <div class="field-group"><label>信息卡片模式</label><select on:input={(e)=>setVal('sidebar.top.style',e.target.value)}><option value="post">文章卡片</option><option value="tagcloud">标签云</option></select></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.sidebar?.toc?.enable !== false} on:change={(e)=>setVal('sidebar.toc.enable',e.target.checked)} /> 文章目录</label></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "font"}
      <div class="tab-panel">
        <h3>字体设置</h3>
        <div class="field-group"><label>字体类型</label><select on:input={(e)=>setVal('font.type',e.target.value)}><option value="auto">系统默认</option><option value="google">Google Fonts</option><option value="local">本地字体</option></select></div>
        <div class="field-group"><label>字体名称</label><input type="text" on:input={(e)=>setVal('font.fontFamily',e.target.value)} placeholder="Noto Sans SC" /></div>
        <div class="field-group"><label>字体来源 URL</label><input type="text" on:input={(e)=>setVal('font.url',e.target.value)} placeholder="https://fonts.googleapis.com/..." /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "announcement"}
      <div class="tab-panel">
        <h3>公告设置</h3>
        <div class="field-group"><label>公告标题</label><input type="text" value={getVal('announcement.title') ?? ''} on:input={(e)=>setVal('announcement.title',e.target.value)} /></div>
        <div class="field-group"><label>公告内容</label><textarea rows="3" on:input={(e)=>setVal('announcement.content',e.target.value)}>{getVal('announcement.content') ?? ''}</textarea></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.announcement?.closable !== false} on:change={(e)=>setVal('announcement.closable',e.target.checked)} /> 允许访客关闭</label></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "analytics"}
      <div class="tab-panel">
        <h3>分析统计</h3>
        <div class="field-group"><label>Google Analytics ID</label><input type="text" value={getVal('analytics.googleAnalyticsId') ?? ''} on:input={(e)=>setVal('analytics.googleAnalyticsId',e.target.value)} /></div>
        <div class="field-group"><label>Microsoft Clarity ID</label><input type="text" value={getVal('analytics.microsoftClarityId') ?? ''} on:input={(e)=>setVal('analytics.microsoftClarityId',e.target.value)} /></div>
        <div class="field-group"><label>Umami Website ID</label><input type="text" value={getVal('analytics.umamiAnalytics.websiteId') ?? ''} on:input={(e)=>setVal('analytics.umamiAnalytics.websiteId',e.target.value)} /></div>
        <div class="field-group"><label>Umami 脚本地址</label><input type="text" value={getVal('analytics.umamiAnalytics.scriptUrl') ?? ''} on:input={(e)=>setVal('analytics.umamiAnalytics.scriptUrl',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "cover"}
      <div class="tab-panel">
        <h3>封面图片</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.coverImage?.enableInPost !== false} on:change={(e)=>setVal('coverImage.enableInPost',e.target.checked)} /> 文章页显示封面</label></div>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.coverImage?.randomCoverImage?.enable} on:change={(e)=>setVal('coverImage.randomCoverImage.enable',e.target.checked)} /> 启用随机封面</label></div>
        <div class="field-group"><label>随机封面回退图片</label><div class="cover-preview"><img src={getVal('coverImage.randomCoverImage.fallback') ?? ''} alt="封面回退图" /><input type="text" value={getVal('coverImage.randomCoverImage.fallback') ?? ''} on:input={(e)=>setVal('coverImage.randomCoverImage.fallback',e.target.value)} /></div></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "portfolio"}
      <div class="tab-panel">
        <h3>作品集</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.portfolio?.defaultEnabled} on:change={(e)=>setVal('portfolio.defaultEnabled',e.target.checked)} /> 默认启用</label></div>
        <div class="field-group"><label>默认角色 ID</label><input type="text" value={getVal('portfolio.defaultCharacterId') ?? ''} on:input={(e)=>setVal('portfolio.defaultCharacterId',e.target.value)} /></div>
        <div class="fields-row"><div class="field-group"><label>桌面顶部默认横幅</label><select value={getVal('portfolio.defaultTopBannerId') ?? ''} on:change={(e)=>setVal('portfolio.defaultTopBannerId',e.target.value)}>{#each (getVal('portfolio.banners.desktop.top') || []) as banner}<option value={banner.id}>{banner.label}</option>{/each}</select></div><div class="field-group"><label>桌面底部默认横幅</label><select value={getVal('portfolio.defaultBottomBannerId') ?? ''} on:change={(e)=>setVal('portfolio.defaultBottomBannerId',e.target.value)}>{#each (getVal('portfolio.banners.desktop.bottom') || []) as banner}<option value={banner.id}>{banner.label}</option>{/each}</select></div></div>
        <div class="fields-row"><div class="field-group"><label>移动顶部默认横幅</label><select value={getVal('portfolio.defaultMobileTopBannerId') ?? ''} on:change={(e)=>setVal('portfolio.defaultMobileTopBannerId',e.target.value)}>{#each (getVal('portfolio.banners.mobile.top') || []) as banner}<option value={banner.id}>{banner.label}</option>{/each}</select></div><div class="field-group"><label>移动底部默认横幅</label><select value={getVal('portfolio.defaultMobileBottomBannerId') ?? ''} on:change={(e)=>setVal('portfolio.defaultMobileBottomBannerId',e.target.value)}>{#each (getVal('portfolio.banners.mobile.bottom') || []) as banner}<option value={banner.id}>{banner.label}</option>{/each}</select></div></div>
        <h3>开屏动画横幅</h3>
        <p class="note">这些图片会显示在首页开屏动画中，可直接预览、修改路径或替换原文件。</p>
        {#each [{ label: '桌面顶部横幅', path: 'portfolio.banners.desktop.top' }, { label: '桌面底部横幅', path: 'portfolio.banners.desktop.bottom' }, { label: '移动顶部横幅', path: 'portfolio.banners.mobile.top' }, { label: '移动底部横幅', path: 'portfolio.banners.mobile.bottom' }] as bannerGroup}
          <h4 class="media-group-title">{bannerGroup.label}</h4>
          <div class="media-grid banner-grid">
            {#each (getVal(bannerGroup.path) || []) as banner, i}
              <div class="media-card"><img src={banner.src} alt={banner.label} loading="lazy" /><input type="text" value={banner.label} on:input={(e)=>updateArrayItem(bannerGroup.path, i, 'label', e.target.value)} placeholder="名称" /><input type="text" value={banner.src} on:input={(e)=>updateArrayItem(bannerGroup.path, i, 'src', e.target.value)} placeholder="图片路径" /><div class="media-actions"><label class="replace-btn">替换横幅<input type="file" accept="image/*" on:change={(e)=>replaceAsset(banner.src,e)} /></label><button class="mini-delete" on:click={()=>removeArrayItem(bannerGroup.path, i)}>删除</button></div></div>
            {/each}
          </div>
        {/each}
        <h3>角色列表</h3>
        <div class="char-list">
          {#each (allConfig.portfolio?.characters || []) as char, i}
            <div class="char-item">
              <img class="char-preview" src={char.thumbnail || char.src} alt={char.label} loading="lazy" /><input type="text" value={char.id} on:input={(e)=>updateArrayItem('portfolio.characters', i, 'id', e.target.value)} placeholder="角色 ID" /><input type="text" value={char.label} on:input={(e)=>updateArrayItem('portfolio.characters', i, 'label', e.target.value)} placeholder="角色名" /><input type="text" value={char.src} on:input={(e)=>updateArrayItem('portfolio.characters', i, 'src', e.target.value)} placeholder="图片路径" style="margin-top:4px" /><input type="text" value={char.thumbnail || ''} on:input={(e)=>updateArrayItem('portfolio.characters', i, 'thumbnail', e.target.value)} placeholder="缩略图路径" style="margin-top:4px" />
            </div>
          {/each}
        </div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "pio"}
      <div class="tab-panel">
        <h3>Spine 角色</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.pio?.spine?.enable} on:change={(e)=>setVal('pio.spine.enable',e.target.checked)} /> 启用 Spine 角色</label></div>
        <div class="field-group"><label>模型路径</label><input type="text" value={getVal('pio.spine.model.path') ?? ''} on:input={(e)=>setVal('pio.spine.model.path',e.target.value)} placeholder="/pio/models/..." /></div>
        <div class="field-group"><label>比例</label><input type="number" step="0.1" value={getVal('pio.spine.model.scale') ?? 1} on:input={(e)=>setVal('pio.spine.model.scale',e.target.value)} /></div>
        <div class="field-group"><label>位置</label><select value={getVal('pio.spine.position.corner') ?? 'bottom-left'} on:change={(e)=>setVal('pio.spine.position.corner',e.target.value)}><option value="bottom-left">左下</option><option value="bottom-right">右下</option><option value="top-left">左上</option><option value="top-right">右上</option></select></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "plantuml"}
      <div class="tab-panel">
        <h3>PlantUML</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.plantuml?.enable !== false} on:change={(e)=>setVal('plantuml.enable',e.target.checked)} /> 启用 PlantUML</label></div>
        <div class="field-group"><label>服务器地址</label><input type="text" value={getVal('plantuml.server') ?? ''} on:input={(e)=>setVal('plantuml.server',e.target.value)} /></div>
        <div class="field-group"><label>亮色主题</label><input type="text" value={getVal('plantuml.lightTheme') ?? ''} on:input={(e)=>setVal('plantuml.lightTheme',e.target.value)} /></div>
        <div class="field-group"><label>深色主题</label><input type="text" value={getVal('plantuml.darkTheme') ?? ''} on:input={(e)=>setVal('plantuml.darkTheme',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "sponsor"}
      <div class="tab-panel">
        <h3>打赏设置</h3>
        <div class="field-group"><label>标题</label><input type="text" value={getVal('sponsor.title') ?? ''} on:input={(e)=>setVal('sponsor.title',e.target.value)} /></div>
        <div class="field-group"><label>说明</label><textarea rows="2" on:input={(e)=>setVal('sponsor.description',e.target.value)}>{getVal('sponsor.description') ?? ''}</textarea></div>
        {#each (allConfig.sponsor?.methods || []) as method, i}
          <div class="fields-row profile-link-row sponsor-method-row"><img src={method.qrCode} alt={method.name} class="qr-preview" /><div class="field-group"><label>方式名称</label><input type="text" value={method.name} on:input={(e)=>updateArrayItem('sponsor.methods', i, 'name', e.target.value)} /></div><div class="field-group"><label>二维码路径</label><input type="text" value={method.qrCode} on:input={(e)=>updateArrayItem('sponsor.methods', i, 'qrCode', e.target.value)} /></div><label><input type="checkbox" checked={method.enabled !== false} on:change={(e)=>updateArrayItem('sponsor.methods', i, 'enabled', e.target.checked)} /> 启用</label></div>
        {/each}
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "license"}
      <div class="tab-panel">
        <h3>版权设置</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.license?.enable !== false} on:change={(e)=>setVal('license.enable',e.target.checked)} /> 显示许可证</label></div>
        <div class="field-group"><label>许可证名称</label><input type="text" value={getVal('license.name') ?? ''} on:input={(e)=>setVal('license.name',e.target.value)} /></div>
        <div class="field-group"><label>许可证链接</label><input type="text" value={getVal('license.url') ?? ''} on:input={(e)=>setVal('license.url',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "gallery"}
      <div class="tab-panel">
        <h3>相册设置</h3>
        <div class="field-group"><label><input type="checkbox" checked={allConfig.gallery?.enable !== false} on:change={(e)=>setVal('gallery.enable',e.target.checked)} /> 启用相册功能</label></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "assets"}
      <div class="tab-panel">
        <h3>资源上传</h3>
        <p class="note">资源会提交到 GitHub 的 public/assets 目录，支持图片、音乐和歌词文件，单文件最大 8 MB。</p>
        <div class="field-group"><label>资源目录</label><select bind:value={assetPath}><option value="assets/images/wallpaper">壁纸</option><option value="assets/images/home-truncated">首页图片</option><option value="assets/images/sponsor">打赏二维码</option><option value="assets/music">音乐文件</option><option value="assets/music/cover">音乐封面</option><option value="assets/music/lrc">歌词文件</option></select></div>
        <div class="field-group"><label>选择文件</label><input type="file" on:change={(e)=>{ assetFile=e.target.files?.[0] ?? null; }} /></div>
        <button class="sync-btn" on:click={uploadAsset} disabled={assetLoading}>{assetLoading ? "上传中..." : "上传并提交到 GitHub"}</button>
        <p class="status" aria-live="polite">{assetStatus}</p>
        <div class="save-notice">上传后请把生成的路径填入壁纸、音乐或打赏配置，再保存并同步配置。</div>
      </div>
    {/if}
    {#if activeTab === "nav"}
      <NavMenuAdmin client:load />
    {/if}
    {#if activeTab === "sync"}
      <div class="tab-panel">
        <h3>数据同步</h3>
        <p class="note">填写 GitHub Token 和仓库信息，点击保存并同步到 GitHub 自动推送所有配置。</p>
        <div class="field-group"><label>GitHub Token</label><input type="password" value={githubToken} on:input={(e)=>{ githubToken=e.target.value }} placeholder="ghp_xxxxxxxxxxxx" /></div>
        <div class="field-group"><label>仓库名（如 owner/repo）</label><input type="text" value={githubRepo} on:input={(e)=>{ githubRepo=e.target.value }} placeholder="DongWanWangLuo/DWanAemeath" /></div>
        <div class="sync-actions">
          <button class="sync-btn" on:click={syncToGitHub} disabled={syncLoading}>{syncLoading ? "同步中..." : "保存并同步到 GitHub"}</button>
          <button class="export-btn" on:click={exportConfig}>导出配置为 JSON 文件</button>
          <label class="import-btn">
            导入配置
            <input type="file" accept=".json" on:change={importConfig} style="display:none">
          </label>
        </div>
        <p class="status">{syncStatus}</p>
        <div class="save-notice">推送成功后，重新构建部署即可生效。</div>
      </div>
    {/if}
    {#if activeTab === "posts"}
      {#if showPostEditor && editingPost}
        <div class="tab-panel post-editor-panel">
          <div class="editor-header"><h3>{editingPost.slug ? "编辑文章" : "新文章"}</h3><button class="close-editor" on:click={closePostEditor}>&times;</button></div>
          <div class="editor-body">
            <div class="field-group"><label>文章标题</label><input type="text" value={editingPost.title} on:input={(e)=>{editingPost.title=e.target.value}} /></div>
            <div class="field-group"><label>描述</label><textarea rows="2" on:input={(e)=>{editingPost.description=e.target.value}}>{editingPost.description}</textarea></div>
            <div class="fields-row">
              <div class="field-group"><label>分类</label><input type="text" value={editingPost.category} on:input={(e)=>{editingPost.category=e.target.value}} /></div>
              <div class="field-group"><label>标签（逗号分隔）</label><input type="text" value={editingPost.tags.join(",")} on:input={(e)=>{editingPost.tags=e.target.value.split(",").map(function(t){return t.trim();}).filter(Boolean);}} /></div>
            </div>
            <div class="fields-row">
              <div class="field-group"><label>发布日期</label><input type="date" value={editingPost.published} on:input={(e)=>{editingPost.published=e.target.value}} /></div>
              <div class="field-group"><label><input type="checkbox" checked={editingPost.draft} on:change={(e)=>{ editingPost.draft=e.target.checked }} /> 草稿模式</label></div>
            </div>
            <div class="field-group"><label>封面图</label><input type="text" value={editingPost.cover} on:input={(e)=>{editingPost.cover=e.target.value}} placeholder="./cover.webp" /></div>
            <div class="field-group"><label>文章内容</label><textarea id="post-content-area" rows="20" on:input={(e)=>{editingPost.content=e.target.value}} style="font-family:monospace;min-height:400px">{editingPost.content || ""}</textarea><p class="note">使用 Markdown 语法编写。保存后会提交到 GitHub，重新构建后生效。</p></div>
            <div class="editor-actions"><button class="save-post-btn" on:click={savePost}>保存文章</button></div>
          </div>
        </div>
      {:else}
        <div class="tab-panel">
          <div class="posts-header"><h3>文章管理</h3><div class="posts-actions"><button class="new-post-btn" on:click={createNewPost}>+ 新建文章</button><button class="refresh-btn" on:click={loadPosts}>刷新列表</button></div></div>
          <div class="posts-list">
            {#if posts.length === 0}<p class="empty-state">暂无文章，点击新建文章开始编写</p>
            {:else}
              {#each posts as post}
                <div class="post-card">
                  <div class="post-info">
                    <div class="post-title">{post.title || post.slug}</div>
                    <div class="post-meta">{post.published} · {post.category || "无分类"}</div>
                    {#if post.draft}<span class="draft-tag">草稿</span>{/if}
                    {#if post.description}<div class="post-desc">{post.description}</div>{/if}
                  </div>
                  <div class="post-actions"><button class="edit-btn" on:click={() => openEditPost(post)}>编辑</button><button class="delete-btn" on:click={() => deletePost(post.slug)}>删除</button></div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="save-notice">文章修改后请点击保存到本地再点击同步到 GitHub。</div>
        </div>
      {/if}
    {/if}

  </div>
</div>
<style>
  :host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .admin-full { display: flex; min-height: 100vh; background: var(--bg-primary, #f8f9fa); color: var(--text-main, #1a1a1a); }
  .admin-sidebar { width: 220px; background: var(--card-bg, #fff); border-right: 1px solid var(--border, #e5e7eb); display: flex; flex-direction: column; flex-shrink: 0; }
  .admin-logo { padding: 20px 16px 16px; font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--border, #e5e7eb); color: var(--primary, #6366f1); }
  .admin-tabs { flex: 1; overflow-y: auto; padding: 8px; }
  .tab-btn { width: 100%; padding: 10px 12px; border: none; background: transparent; text-align: left; cursor: pointer; border-radius: 8px; font-size: 0.88rem; color: var(--text-secondary, #6b7280); margin-bottom: 2px; }
  .tab-btn:hover { background: var(--hover-bg, #f3f4f6); }
  .tab-btn.active { background: var(--primary, #6366f1); color: #fff; font-weight: 600; }
  .admin-actions { padding: 12px; border-top: 1px solid var(--border, #e5e7eb); display: flex; flex-direction: column; gap: 6px; }
  .action-btn { padding: 8px 12px; border: 1px solid var(--border, #e5e7eb); background: var(--card-bg, #fff); border-radius: 6px; cursor: pointer; font-size: 0.82rem; text-align: center; color: var(--text-main, #1a1a1a); }
  .action-btn:hover { background: var(--hover-bg, #f3f4f6); }
  .save-btn { background: var(--primary, #6366f1); color: #fff; border-color: var(--primary, #6366f1); }
  .save-btn:hover { opacity: 0.9; }
  .status-bar { padding: 10px 12px; font-size: 0.8rem; color: #16a34a; min-height: 36px; border-top: 1px solid var(--border, #e5e7eb); word-break: break-all; }
  .back-link { padding: 12px; text-align: center; font-size: 0.85rem; color: var(--text-muted, #9ca3af); border-top: 1px solid var(--border, #e5e7eb); text-decoration: none; }
  .back-link:hover { color: var(--primary, #6366f1); }
  .admin-content { flex: 1; overflow-y: auto; padding: 24px 32px; max-width: 900px; }
  .tab-panel h3 { margin: 0 0 16px; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, #9ca3af); font-weight: 600; }
  .field-group { margin-bottom: 16px; }
  .field-group label { display: block; font-size: 0.88rem; color: var(--text-main, #1a1a1a); margin-bottom: 6px; font-weight: 500; }
  .field-group input[type="text"], .field-group input[type="number"], .field-group input[type="date"], .field-group input[type="password"], .field-group textarea, .field-group select { width: 100%; padding: 9px 12px; border: 1px solid var(--border, #e5e7eb); border-radius: 8px; font-size: 0.9rem; background: var(--input-bg, #fff); color: var(--text-main, #1a1a1a); box-sizing: border-box; }
  .field-group textarea { resize: vertical; min-height: 80px; }
  .field-group input[type="range"] { width: 100%; accent-color: var(--primary, #6366f1); }
  .fields-row { display: flex; gap: 16px; flex-wrap: wrap; }
  .fields-row .field-group { flex: 1; min-width: 200px; }
  label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--primary, #6366f1); }
  .range-pair { display: flex; gap: 8px; }
  .range-pair input { flex: 1; }
  .save-notice { margin-top: 24px; padding: 12px 16px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; font-size: 0.82rem; color: #92400e; }
  .note { font-size: 0.82rem; color: var(--text-muted, #9ca3af); margin-bottom: 12px; }
  .url-list { max-height: 200px; overflow-y: auto; border: 1px solid var(--border, #e5e7eb); border-radius: 8px; }
  .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
  .media-card { min-width: 0; padding: 8px; border: 1px solid var(--border, #e5e7eb); border-radius: 10px; background: var(--card-bg, #fff); }
  .media-card img, .media-card video { display: block; width: 100%; height: 112px; object-fit: cover; border-radius: 7px; background: #111827; margin-bottom: 8px; }
  .video-grid .media-card video { object-fit: contain; }
  .media-card input[type="text"] { width: 100%; box-sizing: border-box; margin-bottom: 7px; }
  .media-actions { display: flex; gap: 6px; align-items: center; }
  .replace-btn { display: inline-flex; align-items: center; padding: 6px 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; cursor: pointer; font-size: 0.78rem; background: var(--hover-bg, #f3f4f6); }
  .replace-btn input { display: none; }
  .url-item { display: flex; gap: 6px; align-items: center; padding: 6px 10px; font-size: 0.8rem; font-family: monospace; border-bottom: 1px solid var(--border, #e5e7eb); word-break: break-all; color: var(--text-secondary, #6b7280); }
  .url-item input { flex: 1; min-width: 0; }
  .url-item:last-child { border-bottom: none; }
  .inline-add, .mini-delete { padding: 6px 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; cursor: pointer; font-size: 0.78rem; }
  .inline-add { margin: 8px 0 18px; background: var(--hover-bg, #f3f4f6); color: var(--text-main, #1a1a1a); }
  .mini-delete { flex-shrink: 0; background: #fff; color: #dc2626; }
  .music-list { display: grid; gap: 10px; margin-bottom: 12px; }
  .music-card { display: flex; gap: 10px; align-items: center; padding: 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 10px; background: var(--card-bg, #fff); }
  .music-card img, .music-placeholder { width: 58px; height: 58px; flex: 0 0 58px; object-fit: cover; border-radius: 8px; background: #e5e7eb; }
  .music-placeholder { display: grid; place-items: center; font-size: 1.5rem; color: #6b7280; }
  .music-info { display: grid; gap: 3px; min-width: 0; flex: 1; }
  .music-info strong, .music-info span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .music-info span { color: var(--text-muted, #9ca3af); font-size: 0.8rem; }
  .music-info input { min-width: 0; width: 100%; }
  .music-info audio { width: 100%; height: 28px; }
  .brand-preview-row { display: flex; gap: 12px; align-items: center; }
  .brand-preview { width: 88px; height: 88px; object-fit: contain; border-radius: 12px; background: #f3f4f6; }
  .avatar-preview { border-radius: 50%; }
  .logo-preview { width: 120px; }
  .brand-fields { flex: 1; display: grid; gap: 8px; min-width: 0; }
  .favicon-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  .favicon-grid .media-card img { height: 90px; object-fit: contain; }
  .banner-grid .media-card img { height: 100px; }
  .media-group-title { margin: 16px 0 8px; font-size: 0.9rem; color: var(--text-main, #1a1a1a); }
  .char-list { display: flex; flex-direction: column; gap: 8px; }
  .char-item { padding: 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 8px; }
  .char-preview { display: block; width: 100%; height: 150px; object-fit: contain; border-radius: 6px; background: #f3f4f6; margin-bottom: 8px; }
  .cover-preview { display: grid; grid-template-columns: 160px 1fr; gap: 10px; align-items: center; }
  .cover-preview img { width: 160px; height: 90px; object-fit: cover; border-radius: 8px; background: #f3f4f6; }
  .sponsor-method-row { align-items: center; padding: 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 8px; }
  .qr-preview { width: 92px; height: 92px; object-fit: contain; border-radius: 6px; background: #f3f4f6; }
  .char-item input { margin-bottom: 4px; }
  .posts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .posts-header h3 { margin: 0; font-size: 1.1rem; text-transform: none; letter-spacing: 0; color: var(--text-main, #1a1a1a); }
  .posts-actions { display: flex; gap: 8px; }
  .new-post-btn, .refresh-btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
  .new-post-btn { background: var(--primary, #6366f1); color: #fff; }
  .refresh-btn { background: var(--hover-bg, #f3f4f6); color: var(--text-main, #1a1a1a); }
  .post-card { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px; border: 1px solid var(--border, #e5e7eb); border-radius: 10px; margin-bottom: 10px; background: var(--card-bg, #fff); }
  .post-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; }
  .post-meta { font-size: 0.78rem; color: var(--text-muted, #9ca3af); }
  .post-desc { font-size: 0.82rem; color: var(--text-secondary, #6b7280); margin-top: 4px; }
  .draft-tag { color: #f59e0b; margin-left: 8px; }
  .post-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .edit-btn, .delete-btn { padding: 5px 12px; border: 1px solid var(--border, #e5e7eb); border-radius: 6px; cursor: pointer; font-size: 0.8rem; background: var(--card-bg, #fff); }
  .edit-btn:hover { background: var(--primary, #6366f1); color: #fff; border-color: var(--primary, #6366f1); }
  .delete-btn:hover { background: #dc2626; color: #fff; border-color: #dc2626; }
  .empty-state { text-align: center; color: var(--text-muted, #9ca3af); padding: 40px 0; }
  .post-editor-panel { max-width: 720px; }
  .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .editor-header h3 { margin: 0; font-size: 1.1rem; text-transform: none; letter-spacing: 0; color: var(--text-main, #1a1a1a); }
  .close-editor { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted, #9ca3af); }
  .editor-body .field-group textarea#post-content-area { font-size: 0.88rem; line-height: 1.6; }
  .editor-actions { margin-top: 16px; }
  .save-post-btn { padding: 10px 24px; background: var(--primary, #6366f1); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
  .sync-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
  .sync-btn { padding: 10px 20px; background: var(--primary, #6366f1); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
  .sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .export-btn, .import-btn { padding: 10px 20px; border: 1px solid var(--border, #e5e7eb); background: var(--card-bg, #fff); border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: var(--text-main, #1a1a1a); text-align: center; }
  .sync-actions .status { margin-top: 12px; font-size: 0.85rem; }
  @media (max-width: 768px) {
    .admin-full { flex-direction: column; }
    .admin-sidebar { width: 100%; max-height: none; border-right: 0; border-bottom: 1px solid var(--border, #e5e7eb); }
    .admin-logo { padding: 14px 16px; }
    .admin-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; max-height: 210px; overflow-y: auto; padding: 8px; }
    .tab-btn { min-width: 0; margin: 0; padding: 9px 6px; text-align: center; font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .admin-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 8px; }
    .back-link { padding: 8px; }
    .status-bar { min-height: 28px; padding: 7px 10px; }
    .admin-content { width: 100%; max-width: none; min-width: 0; padding: 16px 12px 32px; box-sizing: border-box; }
    .fields-row { flex-direction: column; gap: 0; }
    .fields-row .field-group { min-width: 0; }
    .media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .media-card { padding: 6px; }
    .media-card img, .media-card video { height: 96px; }
    .media-actions { flex-wrap: wrap; }
    .replace-btn, .mini-delete, .inline-add { min-height: 34px; padding: 7px 9px; }
    .music-card { align-items: flex-start; flex-wrap: wrap; }
    .music-info { min-width: calc(100% - 70px); }
    .music-card .replace-btn { margin-left: 68px; }
    .brand-preview-row { align-items: flex-start; }
    .brand-preview { width: 68px; height: 68px; flex: 0 0 68px; }
    .logo-preview { width: 90px; }
    .cover-preview { grid-template-columns: 1fr; }
    .cover-preview img { width: 100%; height: 130px; }
    .char-preview { height: 120px; }
    .sponsor-method-row { align-items: flex-start; }
    .qr-preview { width: 72px; height: 72px; }
    .posts-header { align-items: stretch; flex-direction: column; gap: 10px; }
    .posts-actions, .sync-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .post-card { flex-direction: column; gap: 12px; }
    .post-actions { width: 100%; }
    .post-actions button { flex: 1; }
    .post-editor-panel { max-width: none; }
  }
  @media (max-width: 420px) {
    .admin-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 260px; }
    .admin-actions { grid-template-columns: 1fr 1fr; }
    .media-grid { grid-template-columns: 1fr; }
    .sync-actions, .posts-actions { grid-template-columns: 1fr; }
    .field-group input, .field-group textarea, .field-group select { font-size: 16px; }
  }
</style>
