// Admin fetch interceptor - runs in browser before any component mounts
(function () {
  var REPO = "DongWanWangLuo/DWanAemeath";
  var BRANCH = "main";
  var CONTENT_BASE = "https://api.github.com/repos/" + REPO + "/contents/";

  function getToken() {
    if (typeof localStorage === "undefined") return null;
    var raw = localStorage.getItem("tk") || "";
    return raw ? { token: "Bearer " + raw, raw: raw } : null;
  }

  function ghHeaders(tok) {
    var h = { "Content-Type": "application/json" };
    if (tok) h["Authorization"] = tok;
    return h;
  }

  function ghGet(path, token) {
    return fetch(CONTENT_BASE + encodeURIComponent(path), { headers: ghHeaders(token) });
  }

  function ghPut(path, body, token, message) {
    message = message || "chore: update";
    return fetch(CONTENT_BASE + encodeURIComponent(path), {
      method: "PUT",
      headers: ghHeaders(token),
      body: JSON.stringify(Object.assign({ message: message }, body))
    });
  }

  function ghDelete(path, token, sha) {
    return fetch(CONTENT_BASE + encodeURIComponent(path), {
      method: "DELETE",
      headers: ghHeaders(token),
      body: JSON.stringify({ message: "chore: delete", sha: sha, branch: BRANCH })
    });
  }

  function getSha(path, token) {
    return ghGet(path, token).then(function (r) {
      if (!r.ok) return null;
      return r.json().then(function (d) { return d.sha || null; });
    }).catch(function () { return null; });
  }

  function parseFrontmatter(content) {
    var m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) return { fm: {}, body: content };
    var fm = {};
    m[1].split("\n").forEach(function (line) {
      var idx = line.indexOf(":");
      if (idx === -1) return;
      var key = line.slice(0, idx).trim();
      var val = line.slice(idx + 1).trim();
      if (val.indexOf("[") === 0 && val.lastIndexOf("]") === val.length - 1) {
        try { fm[key] = JSON.parse(val); return; } catch (e) {}
      }
      if (/^\d+$/.test(val)) { fm[key] = parseInt(val, 10); return; }
      if (val === "true") { fm[key] = true; return; }
      if (val === "false") { fm[key] = false; return; }
      if ((val.indexOf('"') === 0 && val.lastIndexOf('"') === val.length - 1) ||
          (val.indexOf("'") === 0 && val.lastIndexOf("'") === val.length - 1)) {
        fm[key] = val.slice(1, -1); return;
      }
      fm[key] = val;
    });
    return { fm: fm, body: m[2] || "" };
  }

  function fmToYaml(fm) {
    var lines = [];
    Object.keys(fm).forEach(function (k) {
      var v = fm[k];
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        lines.push(k + ": [" + v.map(function (x) { return typeof x === "string" ? '"' + x + '"' : String(x); }).join(", ") + "]");
      } else if (typeof v === "boolean") {
        lines.push(k + ": " + v);
      } else {
        lines.push(k + ": \"" + String(v).replace(/"/g, '\\"') + "\"");
      }
    });
    return lines.join("\n");
  }

  var _orig = window.fetch;
  window.fetch = function (url, init) {
    var u = typeof url === "string" ? url : (url && url.href) || String(url);
    if (!u.startsWith("/api/")) return _orig.call(this, url, init);
    var tokenInfo = getToken();
    var token = tokenInfo ? tokenInfo.token : null;
    var clean = u.replace(/\/$/, "").replace(/^\/api\//, "");
    var segs = clean.split("/").filter(function (s) { return s.length > 0; });

    // /api/admin/me
    if (clean === "admin/me") {
      var auth = !!(localStorage.getItem("s") && token);
      return Promise.resolve(new Response(JSON.stringify({ authenticated: auth }), { headers: { "Content-Type": "application/json" } }));
    }

    // /api/admin/stats
    if (clean === "admin/stats") {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      return ghGet("src/content/posts", token).then(function (r) { return r.json(); }).then(function (postsData) {
        var dirs = Array.isArray(postsData) ? postsData.filter(function (x) { return x.type === "dir"; }) : [];
        var totalWords = 0, pubCount = 0, draftCount = 0;
        var recent = [];
        var friendsCount = 0, friendsEnabled = 0;

        function processDir(d) {
          return ghGet("src/content/posts/" + d.name + "/index.md", token).then(function (r) { return r.json(); }).then(function (idxData) {
            var decoded = Buffer.from(idxData.content, "base64").toString("utf-8");
            var _p = parseFrontmatter(decoded);
            totalWords += ( _p.body || "").replace(/\s/g, "").length;
            var isDraft = _p.fm.draft === true;
            if (isDraft) draftCount++; else pubCount++;
            if (recent.length < 10) {
              recent.push({ slug: d.name, title: String(_p.fm.title || d.name), categories: _p.fm.category ? [String(_p.fm.category)] : [], tags: Array.isArray(_p.fm.tags) ? _p.fm.tags : [], published: !isDraft, pinned: _p.fm.pinned === true, updated: String(_p.fm.published || "") });
            }
          }).catch(function () {});
        }

        var statsPromise = Promise.all(dirs.map(processDir)).then(function () {
          return ghGet("src/config/friendsConfig.ts", token).then(function (r) { return r.json(); }).then(function (fd) {
            var src = Buffer.from(fd.content, "base64").toString("utf-8");
            var m = src.match(/export const friendsProjects\s*=\s*([^;]+);/);
            if (m) { try { var arr = eval("(" + m[1] + ")"); friendsCount = arr.length; friendsEnabled = arr.filter(function (f) { return f.enabled !== false; }).length; } catch (e) {} }
            return { siteTitle: "DWan博客", totals: { posts: dirs.length, published: pubCount, draft: draftCount, words: totalWords, dynamics: 0, friends: friendsCount, friendsEnabled: friendsEnabled, tags: 0, categories: 0, albums: 0 }, monthlyTrend: [], statusDist: [{ name: "已发布", value: pubCount }, { name: "草稿", value: draftCount }], categoryDist: [], topWords: [], recent: recent };
          });
        });
        return statsPromise.then(function (stats) { return new Response(JSON.stringify(stats), { headers: { "Content-Type": "application/json" } }); });
      });
    }

    // /api/posts (list or create)
    if (segs[0] === "posts" && segs.length <= 1) {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var method = (init && init.method) || "GET";
      if (method === "POST") {
        var body = (init && init.body) || "{}";
        var p = JSON.parse(body);
        var slug = String(p.title || "Untitled").toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
        if (!slug) return Promise.resolve(new Response(JSON.stringify({ ok: false, message: "Invalid slug" }), { status: 400 }));
        var fm = { title: p.title || "Untitled", published: new Date().toISOString().slice(0, 10) };
        if (p.category) fm.category = p.category;
        if (Array.isArray(p.tags) && p.tags.length) fm.tags = p.tags;
        if (p.draft) fm.draft = true;
        if (p.password) fm.password = p.password;
        var fmStr = fmToYaml(fm);
        var postContent = "---\n" + fmStr + "\n---\n\n";
        var fp = "src/content/posts/" + slug;
        return Promise.all([
          ghPut(fp + "/.gitkeep", { content: btoa("") }, token, "chore: create post " + slug),
          ghPut(fp + "/index.md", { content: btoa(postContent) }, token, "chore: create post " + slug)
        ]).then(function () { return new Response(JSON.stringify({ ok: true, slug: slug }), { headers: { "Content-Type": "application/json" } }); });
      }
      // GET list
      return ghGet("src/content/posts", token).then(function (r) { return r.json(); }).then(function (items) {
        var dirs = Array.isArray(items) ? items.filter(function (x) { return x.type === "dir"; }) : [];
        var posts = dirs.map(function (d) {
          return ghGet("src/content/posts/" + d.name + "/index.md", token).then(function (r) { return r.json(); }).then(function (idxData) {
            var decoded = Buffer.from(idxData.content, "base64").toString("utf-8");
            var _p = parseFrontmatter(decoded);
            return { slug: d.name, title: String(_p.fm.title || d.name), date: String(_p.fm.published || ""), published: _p.fm.draft !== true ? 1 : 0, pin_order: _p.fm.pinned ? 1 : 0, password: _p.fm.password ? String(_p.fm.password) : "" };
          }).catch(function () { return { slug: d.name, title: d.name, date: "", published: 1, pin_order: 0 }; });
        });
        return Promise.all(posts).then(function (result) { return new Response(JSON.stringify({ posts: result }), { headers: { "Content-Type": "application/json" } }); });
      });
    }

    // /api/posts/{slug}
    if (segs[0] === "posts" && segs.length === 1) {
      var slug = decodeURIComponent(segs[1]);
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var method2 = (init && init.method) || "GET";
      var filePath = "src/content/posts/" + slug + "/index.md";
      if (method2 === "DELETE") {
        return getSha(filePath, token).then(function (sha) {
          if (!sha) return new Response(JSON.stringify({ ok: false, message: "Post not found" }), { status: 404 });
          return ghDelete(filePath, token, sha).then(function (r) {
            return ghDelete(slug + "/.gitkeep", token, null).catch(function () {});
          }).then(function () { return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); });
        });
      }
      if (method2 === "PUT") {
        return getSha(filePath, token).then(function (sha) {
          if (!sha) return new Response(JSON.stringify({ ok: false, message: "Post not found" }), { status: 404 });
          var b = (init && init.body) || "{}";
          var p2 = JSON.parse(b);
          var fm2 = { title: p2.title || "Untitled" };
          if (p2.category) fm2.category = p2.category;
          if (Array.isArray(p2.tags)) fm2.tags = p2.tags;
          fm2.draft = p2.draft === true;
          if (p2.password) fm2.password = p2.password;
          if (p2.description) fm2.description = p2.description;
          if (p2.image) fm2.image = p2.image;
          if (p2.updated) fm2.updated = p2.updated;
          var bodyText = p2.content ? String(p2.content) : "";
          var newContent = "---\n" + fmToYaml(fm2) + "\n---\n\n" + bodyText;
          return ghPut(filePath, { content: btoa(newContent), sha: sha }, token, "chore: update post " + slug).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return new Response(JSON.stringify({ ok: r.ok, ...d }), { headers: { "Content-Type": "application/json" } }); }); });
        });
      }
      // GET
      return ghGet(filePath, token).then(function (r) {
        if (!r.ok) return r;
        return r.json().then(function (data) {
          var decoded = Buffer.from(data.content, "base64").toString("utf-8");
          var _p = parseFrontmatter(decoded);
          return new Response(JSON.stringify({ slug: slug, title: String(_p.fm.title || slug), frontmatter: _p.fm, content: _p.body, date: String(_p.fm.published || "") }), { headers: { "Content-Type": "application/json" } });
        });
      });
    }

    // /api/friends
    if (segs[0] === "friends" && segs.length <= 1) {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var method3 = (init && init.method) || "GET";
      return ghGet("src/config/friendsConfig.ts", token).then(function (r) { return r.json(); }).then(function (data) {
        var src = Buffer.from(data.content, "base64").toString("utf-8");
        var m3 = src.match(/export const friendsProjects\s*=\s*([^;]+);/);
        var items = [];
        if (m3) { try { items = eval("(" + m3[1] + ")"); } catch (e) {} }
        items = items.map(function (item, i) { return Object.assign({ id: i + 1 }, item); });
        if (method3 === "POST") {
          var newItem = JSON.parse((init && init.body) || "{}");
          var nextId = items.length > 0 ? Math.max.apply(null, items.map(function (it) { return it.id; })) + 1 : 1;
          items.push({ id: nextId, ...newItem });
          var newSrc = src.replace(/export const friendsProjects\s*=\s*[^;]+;/, "export const friendsProjects = " + JSON.stringify(items, null, 2) + ";");
          return ghPut("src/config/friendsConfig.ts", { content: btoa(newSrc), sha: data.sha }, token, "chore: add friend").then(function () { return new Response(JSON.stringify({ ok: true, item: items[items.length - 1] }), { headers: { "Content-Type": "application/json" } }); });
        }
        return new Response(JSON.stringify({ items: items }), { headers: { "Content-Type": "application/json" } });
      });
    }

    // /api/friends/{id}
    if (segs[0] === "friends" && segs.length === 1) {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var id = parseInt(segs[1], 10);
      var method4 = (init && init.method) || "GET";
      return ghGet("src/config/friendsConfig.ts", token).then(function (r) { return r.json(); }).then(function (data) {
        var src = Buffer.from(data.content, "base64").toString("utf-8");
        var m4 = src.match(/export const friendsProjects\s*=\s*([^;]+);/);
        var items = [];
        if (m4) { try { items = eval("(" + m4[1] + ")"); } catch (e) {} }
        items = items.map(function (item, i) { return Object.assign({ id: i + 1 }, item); });
        if (method4 === "DELETE") {
          items = items.filter(function (it) { return it.id !== id; });
          var newSrc4 = src.replace(/export const friendsProjects\s*=\s*[^;]+;/, "export const friendsProjects = " + JSON.stringify(items, null, 2) + ";");
          return ghPut("src/config/friendsConfig.ts", { content: btoa(newSrc4), sha: data.sha }, token, "chore: delete friend").then(function () { return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); });
        }
        if (method4 === "PUT") {
          var updated = JSON.parse((init && init.body) || "{}");
          items = items.map(function (it) { return it.id === id ? Object.assign({}, it, updated) : it; });
          var newSrc4b = src.replace(/export const friendsProjects\s*=\s*[^;]+;/, "export const friendsProjects = " + JSON.stringify(items, null, 2) + ";");
          return ghPut("src/config/friendsConfig.ts", { content: btoa(newSrc4b), sha: data.sha }, token, "chore: update friend").then(function () { return new Response(JSON.stringify({ ok: true, item: items.find(function (it) { return it.id === id; }) }), { headers: { "Content-Type": "application/json" } }); });
        }
        var item = items.find(function (it) { return it.id === id; });
        return new Response(JSON.stringify(item || {}), { headers: { "Content-Type": "application/json" } });
      });
    }

    // /api/notice
    if (clean === "notice") {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var method5 = (init && init.method) || "GET";
      return ghGet("src/config/announcementConfig.ts", token).then(function (r) { return r.json(); }).then(function (data) {
        var src = Buffer.from(data.content, "base64").toString("utf-8");
        var tM = src.match(/title:\s*"([^"]*)"/);
        var cM = src.match(/content:\s*"([\s\S]*?)"/);
        var notice = { title: tM ? tM[1] : "公告栏", sections: cM ? [{ label: "", lines: [{ text: cM[1].replace(/\\n/g, "\n") }] }] : [] };
        if (method5 === "PUT") {
          var b5 = JSON.parse((init && init.body) || "{}");
          var newT = b5.title || notice.title;
          var newC = (b5.sections && b5.sections[0] && b5.sections[0].lines && b5.sections[0].lines[0] && b5.sections[0].lines[0].text) || (notice.sections && notice.sections[0] && notice.sections[0].lines && notice.sections[0].lines[0] && notice.sections[0].lines[0].text) || "";
          var newSrc5 = src.replace(/title:\s*"[^"]*"/, 'title: "' + newT + '"').replace(/content:\s*"[^"]*"/, 'content: "' + newC.replace(/"/g, '\\\\"') + '"');
          return ghPut("src/config/announcementConfig.ts", { content: btoa(newSrc5), sha: data.sha }, token, "chore: update notice").then(function () { return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); });
        }
        return new Response(JSON.stringify(notice), { headers: { "Content-Type": "application/json" } });
      });
    }

    // /api/about
    if (clean === "about") {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var method6 = (init && init.method) || "GET";
      return ghGet("src/content/spec/about.md", token).then(function (r) { return r.json(); }).then(function (data) {
        var content = Buffer.from(data.content, "base64").toString("utf-8");
        if (method6 === "PUT") {
          var b6 = (init && init.body) || "";
          return ghPut("src/content/spec/about.md", { content: btoa(b6), sha: data.sha }, token, "chore: update about").then(function () { return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); });
        }
        return new Response(JSON.stringify({ source: content }), { headers: { "Content-Type": "application/json" } });
      });
    }

    // /api/site-links
    if (segs[0] === "site-links" && segs.length <= 1) {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var method7 = (init && init.method) || "GET";
      return ghGet("src/config/sponsorConfig.ts", token).then(function (r) { return r.json(); }).then(function (data) {
        var src = Buffer.from(data.content, "base64").toString("utf-8");
        var m7 = src.match(/export const sponsorConfig\s*=\s*([^;]+);/);
        var config = {};
        if (m7) { try { config = eval("(" + m7[1] + ")"); } catch (e) {} }
        var items = (config.methods || []).map(function (m, i) { return { id: i + 1, name: m.name || "", url: m.link || "", icon: m.icon || "", location: "sponsor", kind: m.qrCode ? "qr" : "link", enabled: m.enabled !== false, sortOrder: i }; });
        if (method7 === "POST") {
          var newItem = JSON.parse((init && init.body) || "{}");
          var nextId = items.length > 0 ? Math.max.apply(null, items.map(function (it) { return it.id; })) + 1 : 1;
          items.push({ id: nextId, ...newItem });
          config.methods = items.map(function (it) { return { name: it.name, icon: it.icon, qrCode: it.kind === "qr" ? "" : undefined, link: it.url, description: it.name, enabled: it.enabled }; });
          var newSrc7 = src.replace(/export const sponsorConfig\s*=\s*[^;]+;/, "export const sponsorConfig = " + JSON.stringify(config, null, 2) + ";");
          return ghPut("src/config/sponsorConfig.ts", { content: btoa(newSrc7), sha: data.sha }, token, "chore: add site link").then(function () { return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); });
        }
        return new Response(JSON.stringify({ items: items }), { headers: { "Content-Type": "application/json" } });
      });
    }

    // /api/site-links/{id}
    if (segs[0] === "site-links" && segs.length === 1) {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var id7 = parseInt(segs[1], 10);
      var method8 = (init && init.method) || "GET";
      return ghGet("src/config/sponsorConfig.ts", token).then(function (r) { return r.json(); }).then(function (data) {
        var src = Buffer.from(data.content, "base64").toString("utf-8");
        var m8 = src.match(/export const sponsorConfig\s*=\s*([^;]+);/);
        var config = {};
        if (m8) { try { config = eval("(" + m8[1] + ")"); } catch (e) {} }
        var items = (config.methods || []).map(function (m, i) { return { id: i + 1, name: m.name, url: m.link || "", icon: m.icon, location: "sponsor", kind: m.qrCode ? "qr" : "link", enabled: m.enabled !== false, sortOrder: i }; });
        if (method8 === "DELETE") {
          var idx = items.findIndex(function (it) { return it.id === id7; });
          if (idx !== -1) items.splice(idx, 1);
          config.methods = items.map(function (it) { return { name: it.name, icon: it.icon, link: it.url, description: it.name, enabled: it.enabled }; });
          var newSrc8 = src.replace(/export const sponsorConfig\s*=\s*[^;]+;/, "export const sponsorConfig = " + JSON.stringify(config, null, 2) + ";");
          return ghPut("src/config/sponsorConfig.ts", { content: btoa(newSrc8), sha: data.sha }, token, "chore: delete site link").then(function () { return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); });
        }
        if (method8 === "PUT") {
          var updated = JSON.parse((init && init.body) || "{}");
          var idx2 = items.findIndex(function (it) { return it.id === id7; });
          if (idx2 !== -1) items[idx2] = Object.assign({}, items[idx2], updated);
          config.methods = items.map(function (it) { return { name: it.name, icon: it.icon, link: it.url, description: it.name, enabled: it.enabled }; });
          var newSrc8b = src.replace(/export const sponsorConfig\s*=\s*[^;]+;/, "export const sponsorConfig = " + JSON.stringify(config, null, 2) + ";");
          return ghPut("src/config/sponsorConfig.ts", { content: btoa(newSrc8b), sha: data.sha }, token, "chore: update site link").then(function () { return new Response(JSON.stringify({ ok: true, item: items[idx2] }), { headers: { "Content-Type": "application/json" } }); });
        }
        var item = items.find(function (it) { return it.id === id7; });
        return new Response(JSON.stringify(item || {}), { headers: { "Content-Type": "application/json" } });
      });
    }

    // /api/settings
    if (segs[0] === "settings") {
      if (!token) return Promise.resolve(new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }));
      var method9 = (init && init.method) || "GET";
      return ghGet("src/config/siteConfig.ts", token).then(function (r) { return r.json(); }).then(function (data) {
        var src = Buffer.from(data.content, "base64").toString("utf-8");
        var suM = src.match(/site_url:\s*"([^"]*)"/);
        var settings = { siteUrl: suM ? suM[1] : "" };
        if (method9 === "PUT") {
          var b9 = JSON.parse((init && init.body) || "{}");
          var groups = b9.groups || {};
          if (groups.basic && groups.basic.siteUrl) {
            var newSrc9 = src.replace(/site_url:\s*"[^"]*"/, 'site_url: "' + groups.basic.siteUrl + '"');
            return getSha("src/config/siteConfig.ts", token).then(function (sha) {
              return ghPut("src/config/siteConfig.ts", { content: btoa(newSrc9), sha: sha }, token, "chore: update settings").then(function () { return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }); });
            });
          }
          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify(settings), { headers: { "Content-Type": "application/json" } });
      });
    }

    return _orig.call(this, url, init);
  };

  window.apiJson = async function (url, init) {
    var resp = await fetch(url, Object.assign({ credentials: "include" }, init));
    var data = await resp.json().catch(function () { return null; });
    if (!resp.ok) {
      var msg = (data && typeof data === "object" && "message" in data ? data.message : null) || resp.statusText || String(resp.status);
      throw new Error(msg);
    }
    return data;
  };
})();