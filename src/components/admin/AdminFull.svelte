<script lang='ts'>
  import NavMenuAdmin from "./NavMenuAdmin.svelte";
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
    { id: "posts", label: "文章管理" },
    { id: "nav", label: "导航栏" },
    { id: "sync", label: "数据同步" },
  ];

  async function loadAllConfigs() {
    try { const res = await fetch("/api/configs.json"); if (res.ok) { allConfig = await res.json(); } else { syncStatus = "找不到配置文件"; } } catch (e) { syncStatus = "请求失败: " + e.message; }
  }
  function getVal(path) { const keys = path.split("."); let cur = allConfig; for (const k of keys) { if (cur == null) return undefined; cur = cur[k]; } return cur; }
  function setVal(path, value) { const keys = path.split("."); let cur = allConfig; for (let i = 0; i < keys.length - 1; i++) { if (!cur[keys[i]]) cur[keys[i]] = {}; cur = cur[keys[i]]; } cur[keys[keys.length - 1]] = value; }
  function toggleBool(path) { const c = getVal(path); setVal(path, !c); }
  function saveToLocal() { try { localStorage.setItem("dw_all_configs", JSON.stringify(allConfig)); saveStatus = "保存成功！重新加载网页后生效"; setTimeout(() => { saveStatus = ""; }, 3000); } catch(e) { saveStatus = "保存失败: " + e.message; } }
  async function syncToGitHub() {
    if (!githubToken || !githubRepo) { syncStatus = "请先填写 GitHub Token 和仓库名"; return; }
    syncLoading = true; syncStatus = "同步中...";
    localStorage.setItem("dw_admin_github_token", githubToken); localStorage.setItem("dw_admin_github_repo", githubRepo);
    try {
      const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: githubToken, repo: githubRepo, config: allConfig }) });
      const result = await res.json();
      if (result.ok) { syncStatus = "同步成功！配置已推送到 GitHub。"; } else { syncStatus = "同步失败: " + (result.error || "未知错误"); }
    } catch(e) { syncStatus = "请求失败: " + e.message; } finally { syncLoading = false; }
  }
  function exportConfig() { const blob = new Blob([JSON.stringify(allConfig, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "dwan-config-" + new Date().toISOString().slice(0,10) + ".json"; a.click(); URL.revokeObjectURL(url); }
  function importConfig(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(ev) { try { allConfig = JSON.parse(ev.target.result); saveStatus = "导入成功！请点击保存。"; } catch(err) { saveStatus = "文件格式错误"; } }; reader.readAsText(file); e.target.value = ""; }
  async function loadPosts() {
    try { const res = await fetch("/api/allPostMeta.json"); if (res.ok) { const data = await res.json(); posts = (data.posts || data).map(function(p) { return { slug: p.slug || p.fileSlug, title: p.frontmatter?.title || p.title || p.slug, description: p.frontmatter?.description || "", category: p.frontmatter?.category || "", tags: p.frontmatter?.tags || [], published: p.frontmatter?.published || "", draft: p.frontmatter?.draft === true, cover: p.frontmatter?.image || "" }; }); } } catch(e) { posts = []; }
  }
  function openEditPost(post) { editingPost = JSON.parse(JSON.stringify(post)); showPostEditor = true; }
  function closePostEditor() { showPostEditor = false; editingPost = null; }
  function savePost() { if (!editingPost) return; const idx = posts.findIndex(function(p){ return p.slug === editingPost.slug; }); if (idx >= 0) posts[idx] = editingPost; else posts.push(editingPost); saveStatus = "文章已保存（本地缓存）"; setTimeout(() => { saveStatus = ""; showPostEditor = false; }, 1500); }
  function deletePost(slug) { if (!confirm("确定删除这篇文章？")) return; posts = posts.filter(function(p){ return p.slug !== slug; }); saveStatus = "已移除（点击同步推送至 GitHub）"; }
  function createNewPost() { editingPost = { slug: "new-post-"+Date.now(), title: "新文章", description: "", category: "", tags: [], published: new Date().toISOString().slice(0,10), draft: true, cover: "", content: "" }; showPostEditor = true; }

  loadAllConfigs(); loadPosts();
  try { const t = localStorage.getItem("dw_admin_github_token"); if(t) githubToken = t; const r = localStorage.getItem("dw_admin_github_repo"); if(r) githubRepo = r; } catch(e) {}
</script>

  <div class="admin-content">
    {#if activeTab === "site"}
      <div class="tab-panel">
        <h3>网站基本信息</h3>
        <div class="field-group"><label>网站标题</label><input type="text" on:input={(e)=>setVal('site.title',e.target.value)} /></div>
        <div class="field-group"><label>子标题</label><input type="text" on:input={(e)=>setVal('site.subtitle',e.target.value)} /></div>
        <div class="field-group"><label>网站描述</label><textarea rows="3" on:input={(e)=>setVal('site.description',e.target.value)}></textarea></div>
        <div class="field-group"><label>网站地址</label><input type="text" on:input={(e)=>setVal('site.site_url',e.target.value)} /></div>
        <div class="field-group"><label>主题版本</label><input type="text" on:input={(e)=>setVal('site.themeVersion',e.target.value)} /></div>
        <div class="field-group"><label>网站开始日期</label><input type="date" on:input={(e)=>setVal('site.siteStartDate',e.target.value)} /></div>
        <h3>主题色调</h3>
        <div class="field-group"><label>色相值 (0-360)</label><input type="range" min="0" max="360" on:input={(e)=>setVal('site.themeColor.hue',e.target.value)} /><span>{allConfig.site?.themeColor?.hue}</span></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.site?.themeColor?.fixed} /> 固定色相</label></div>
        <div class="field-group"><label>默认模式</label><select on:input={(e)=>setVal('site.themeColor.defaultMode',e.target.value)}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></div>
        <h3>首页页面设置</h3>
        <div class="field-group"><label>屏幕宽度 (%)</label><input type="number" on:input={(e)=>setVal('site.pageWidth',e.target.value)} /></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.site?.categoryBar} /> 分类导航栏</label></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.site?.foldArticle} /> 文章折叠</label></div>
        <h3>功能页面</h3>
        <div class="fields-row">
          <label><input type="checkbox" bind:checked={allConfig.site?.pages?.friends} /> friends</label>
          <label><input type="checkbox" bind:checked={allConfig.site?.pages?.sponsor} /> sponsor</label>
          <label><input type="checkbox" bind:checked={allConfig.site?.pages?.guestbook} /> guestbook</label>
          <label><input type="checkbox" bind:checked={allConfig.site?.pages?.bangumi} /> bangumi</label>
          <label><input type="checkbox" bind:checked={allConfig.site?.pages?.gallery} /> gallery</label>
          <label><input type="checkbox" bind:checked={allConfig.site?.pages?.anime} /> anime</label>
        </div>
        <h3>文章列表设置</h3>
        <div class="field-group"><label>默认布局</label><select on:input={(e)=>setVal('site.postListLayout.defaultMode',e.target.value)}><option value="grid">网格</option><option value="list">列表</option></select></div>
        <div class="fields-row"><label><input type="checkbox" bind:checked={allConfig.site?.postListLayout?.showTags} /> 显示标签</label><label><input type="checkbox" bind:checked={allConfig.site?.postListLayout?.allowSwitch} /> 允许切换布局</label></div>
        <div class="field-group"><label>每页文章数</label><input type="number" on:input={(e)=>setVal('site.pagination.postsPerPage',e.target.value)} /></div>
        <h3>番组计划</h3>
        <div class="field-group"><label>Bangumi 用户ID</label><input type="text" on:input={(e)=>setVal('site.bangumi.userId',e.target.value)} /></div>
        <div class="field-group"><label>Bilibili UID</label><input type="text" on:input={(e)=>setVal('site.anime.bilibili.uid',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存，再点击同步到 GitHub 生效</div>
      </div>
    {/if}
    {#if activeTab === "effects"}
      <div class="tab-panel">
        <h3>动画特效控制</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.effects?.enable} /> 整体特效开关</label></div>
        <h3>樱花特效</h3>
        <div class="field-group"><label>樱花数量</label><input type="number" on:input={(e)=>setVal('effects.sakuraNum',e.target.value)} /></div>
        <div class="field-group"><label>大小范围</label><div class="range-pair"><input type="number" step="0.1" on:input={(e)=>setVal('effects.size.min',e.target.value)} /><input type="number" step="0.1" on:input={(e)=>setVal('effects.size.min',e.target.value)} /></div></div>
        <div class="field-group"><label>透明度范围</label><div class="range-pair"><input type="number" step="0.1" on:input={(e)=>setVal('effects.opacity.min',e.target.value)} /><input type="number" step="0.1" on:input={(e)=>setVal('effects.opacity.min',e.target.value)} /></div></div>
        <h3>水波纹动画</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.wallpaper?.common?.waves?.enable?.desktop} /> 水波纹开关</label></div>
        <h3>渐变过渡</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.wallpaper?.common?.gradient?.enable?.desktop} /> 渐变过渡开关</label></div>
        <h3>首页横幅标题</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.wallpaper?.common?.homeText?.enable} /> 首页标题显示</label></div>
        <h3>轮播模式</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.wallpaper?.common?.carousel?.enable} /> 背景轮播开关</label></div>
        <div class="save-notice">修改后请点击保存，再点击同步到 GitHub 生效</div>
      </div>
    {/if}
    {#if activeTab === "wallpaper"}
      <div class="tab-panel">
        <h3>背景壁纸</h3>
        <div class="field-group"><label>壁纸模式</label><select on:input={(e)=>setVal('wallpaper.mode',e.target.value)}><option value="fullscreen">全屏</option><option value="banner">横幅</option><option value="overlay">透明覆盖</option><option value="none">纯色背景</option></select></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.wallpaper?.switchable} /> 允许用户切换背景</label></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.wallpaper?.playerEnable} /> 显示背景播放器</label></div>
        <h3>桌面背景图</h3>
        <p class="note">当前配置的背景图列表（共 "{(allConfig.wallpaper?.src?.desktop || []).length}" 张）：</p>
        <div class="url-list">
          {#each (allConfig.wallpaper?.src?.desktop || []) as url}
            <div class="url-item">{url}</div>
          {/each}
        </div>
        <div class="save-notice">要添加新背景图，请先将图片放入 assets/images/wallpaper/ 目录，然后在 GitHub 编辑配置文件添加路径。</div>
      </div>
    {/if}
    {#if activeTab === "music"}
      <div class="tab-panel">
        <h3>背景音乐</h3>
        <div class="field-group"><label>音乐源</label><input type="text" on:input={(e)=>setVal('music.src',e.target.value)} placeholder="https://example.com/music.mp3" /></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.music?.autoplay} /> 自动播放</label></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.music?.loop} /> 循环播放</label></div>
        <div class="field-group"><label>音乐图标</label><input type="text" on:input={(e)=>setVal('music.icon',e.target.value)} placeholder="/assets/images/music-icon.png" /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "comment"}
      <div class="tab-panel">
        <h3>评论系统</h3>
        <div class="field-group"><label>评论插件</label><select on:input={(e)=>setVal('comment.provider',e.target.value)}><option value="twikoo">Twikoo</option><option value="waline">Waline</option><option value="giscus">Giscus</option><option value="disabled">关闭</option></select></div>
        <div class="field-group"><label>Twikoo 地址</label><input type="text" on:input={(e)=>setVal('comment.envId',e.target.value)} placeholder="https://twikoo.example.com" /></div>
        <div class="field-group"><label>Waline 服务器地址</label><input type="text" on:input={(e)=>setVal('comment.serverURL',e.target.value)} /></div>
        <div class="field-group"><label>Giscus 参数</label><input type="text" on:input={(e)=>setVal('comment.repo',e.target.value)} placeholder="仓库名" style="margin-bottom:8px"/><input type="text" on:input={(e)=>setVal('comment.repo',e.target.value)} placeholder="repo ID" /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "profile"}
      <div class="tab-panel">
        <h3>个人资料</h3>
        <div class="field-group"><label>头像 URL</label><input type="text" on:input={(e)=>setVal('profile.avatar',e.target.value)} /></div>
        <div class="field-group"><label>姓名</label><input type="text" on:input={(e)=>setVal('profile.name',e.target.value)} /></div>
        <div class="field-group"><label>个人简介</label><textarea rows="3" on:input={(e)=>setVal('profile.bio',e.target.value)}></textarea></div>
        <div class="field-group"><label>博客封面背景</label><input type="text" on:input={(e)=>setVal('profile.blogWallpaper',e.target.value)} /></div>
        <h3>社交链接</h3>
        <div class="field-group"><label>Github</label><input type="text" on:input={(e)=>setVal('profile.social.github',e.target.value)} /></div>
        <div class="field-group"><label>Bilibili</label><input type="text" on:input={(e)=>setVal('profile.social.bilibili',e.target.value)} /></div>
        <div class="field-group"><label>Weibo</label><input type="text" on:input={(e)=>setVal('profile.social.weibo',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "sidebar"}
      <div class="tab-panel">
        <h3>侧边栏设置</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.sidebar?.card?.enable !== false} /> 侧边栏卡片</label></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.sidebar?.top?.enable !== false} /> 顶部信息卡片</label></div>
        <div class="field-group"><label>信息卡片模式</label><select on:input={(e)=>setVal('sidebar.top.style',e.target.value)}><option value="post">文章卡片</option><option value="tagcloud">标签云</option></select></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.sidebar?.toc?.enable !== false} /> 文章目录</label></div>
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
        <div class="field-group"><label>公告内容</label><textarea rows="3" on:input={(e)=>setVal('announcement.content',e.target.value)}></textarea></div>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.announcement?.enable !== false} /> 显示公告</label></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "analytics"}
      <div class="tab-panel">
        <h3>分析统计</h3>
        <div class="field-group"><label>统计方式</label><select on:input={(e)=>setVal('analytics.type',e.target.value)}><option value="baidu">百度统计</option><option value="umami">Umami</option><option value="cloudflare">Cloudflare Web Analytics</option><option value="none">关闭</option></select></div>
        <div class="field-group"><label>Token / ID</label><input type="text" on:input={(e)=>setVal('analytics.token',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "cover"}
      <div class="tab-panel">
        <h3>封面图片</h3>
        <div class="field-group"><label>默认封面图</label><input type="text" on:input={(e)=>setVal('coverImage.default',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "portfolio"}
      <div class="tab-panel">
        <h3>作品集</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.portfolio?.defaultEnabled} /> 默认启用</label></div>
        <div class="field-group"><label>默认角色 ID</label><input type="text" on:input={(e)=>setVal('portfolio.defaultCharacterId',e.target.value)} /></div>
        <h3>角色列表</h3>
        <div class="char-list">
          {#each (allConfig.portfolio?.characters || []) as char, i}
            <div class="char-item">
              <input type="text" bind:value={char.label} placeholder="角色名" /><input type="text" bind:value={char.src} placeholder="图片路径" style="margin-top:4px" />
            </div>
          {/each}
        </div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "pio"}
      <div class="tab-panel">
        <h3>Spine 角色</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.pio?.model?.enable} /> 启用 Spine 角色</label></div>
        <div class="field-group"><label>模型路径</label><input type="text" on:input={(e)=>setVal('pio.model.path',e.target.value)} placeholder="/pio/models/..." /></div>
        <div class="field-group"><label>比例</label><input type="number" step="0.1" on:input={(e)=>setVal('pio.model.scale',e.target.value)} /></div>
        <div class="field-group"><label>位置</label><select on:input={(e)=>setVal('pio.position.corner',e.target.value)}><option value="bottom-left">左下</option><option value="bottom-right">右下</option></select></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "plantuml"}
      <div class="tab-panel">
        <h3>PlantUML</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.plantuml?.enable !== false} /> 启用 PlantUML</label></div>
        <div class="field-group"><label>服务器地址</label><input type="text" on:input={(e)=>setVal('plantuml.server',e.target.value)} /></div>
        <div class="field-group"><label>深色主题</label><input type="text" on:input={(e)=>setVal('plantuml.darkTheme',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "sponsor"}
      <div class="tab-panel">
        <h3>打赏设置</h3>
        <div class="field-group"><label>微信支付二维码</label><input type="text" on:input={(e)=>setVal('sponsor.wechat',e.target.value)} placeholder="/assets/images/...wechat.png" /></div>
        <div class="field-group"><label>支付宝二维码</label><input type="text" on:input={(e)=>setVal('sponsor.alipay',e.target.value)} placeholder="/assets/images/...alipay.png" /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "license"}
      <div class="tab-panel">
        <h3>版权设置</h3>
        <div class="field-group"><label>许可证类型</label><input type="text" on:input={(e)=>setVal('license.type',e.target.value)} /></div>
        <div class="field-group"><label>版权信息</label><input type="text" on:input={(e)=>setVal('license.text',e.target.value)} /></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "gallery"}
      <div class="tab-panel">
        <h3>相册设置</h3>
        <div class="field-group"><label><input type="checkbox" bind:checked={allConfig.gallery?.enable !== false} /> 启用相册功能</label></div>
        <div class="save-notice">修改后请点击保存并同步。</div>
      </div>
    {/if}
    {#if activeTab === "nav"}
      <NavMenuAdmin client:load />
    {/if}
    {#if activeTab === "sync"}
      <div class="tab-panel">
        <h3>数据同步</h3>
        <p class="note">填写 GitHub Token 和仓库信息，点击保存并同步到 GitHub 自动推送所有配置。</p>
        <div class="field-group"><label>GitHub Token</label><input type="password" bind:value={githubToken} placeholder="ghp_xxxxxxxxxxxx" /></div>
        <div class="field-group"><label>仓库名（如 owner/repo）</label><input type="text" bind:value={githubRepo} placeholder="DongWanWangLuo/DWanAemeath" /></div>
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
            <div class="field-group"><label>文章标题</label><input type="text" on:input={(e)=>{editingPost.title=e.target.value}} /></div>
            <div class="field-group"><label>描述</label><textarea rows="2" on:input={(e)=>{editingPost.description=e.target.value}}></textarea></div>
            <div class="fields-row">
              <div class="field-group"><label>分类</label><input type="text" on:input={(e)=>{editingPost.category=e.target.value}} /></div>
              <div class="field-group"><label>标签（逗号分隔）</label><input type="text" value={editingPost.tags.join(",")} on:input={(e)=>{editingPost.tags=e.target.value.split(",").map(function(t){return t.trim();}).filter(Boolean);}} /></div>
            </div>
            <div class="fields-row">
              <div class="field-group"><label>发布日期</label><input type="date" on:input={(e)=>{editingPost.published=e.target.value}} /></div>
              <div class="field-group"><label><input type="checkbox" bind:checked={editingPost.draft} /> 草稿模式</label></div>
            </div>
            <div class="field-group"><label>封面图</label><input type="text" on:input={(e)=>{editingPost.cover=e.target.value}} placeholder="./cover.webp" /></div>
            <div class="field-group"><label>文章内容</label><textarea id="post-content-area" rows="20" on:input={(e)=>{editingPost.content=e.target.value}} style="font-family:monospace;min-height:400px"></textarea><p class="note">使用 Markdown 语法编写。保存后同步到 GitHub 即可生效。</p></div>
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
  .url-item { padding: 6px 10px; font-size: 0.8rem; font-family: monospace; border-bottom: 1px solid var(--border, #e5e7eb); word-break: break-all; color: var(--text-secondary, #6b7280); }
  .url-item:last-child { border-bottom: none; }
  .char-list { display: flex; flex-direction: column; gap: 8px; }
  .char-item { padding: 10px; border: 1px solid var(--border, #e5e7eb); border-radius: 8px; }
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
    .admin-sidebar { width: 100%; max-height: 300px; }
    .admin-content { padding: 16px; }
    .fields-row { flex-direction: column; gap: 0; }
  }
</style>
