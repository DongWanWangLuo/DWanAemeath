"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
exports.getDb = getDb;
var hono_1 = require("hono");
var node_server_1 = require("@hono/node-server");
var index_js_1 = require("./db/index.js");
var auth_js_1 = require("./routes/auth.js");
var posts_js_1 = require("./routes/posts.js");
var gallery_js_1 = require("./routes/gallery.js");
var settings_js_1 = require("./routes/settings.js");
var friends_js_1 = require("./routes/friends.js");
var notice_js_1 = require("./routes/notice.js");
var dynamic_js_1 = require("./routes/dynamic.js");
var siteLinks_js_1 = require("./routes/siteLinks.js");
var middleware_js_1 = require("./server/auth/middleware.js");
var fs = require("fs");
var path = require("path");
function getEnv() {
    return {
        DB: { prepare: function (sql) { return index_js_1.db.prepare(sql); } },
        BUCKET: null,
        SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret-change-me',
    };
}
function getDb() { return index_js_1.db; }
var app = new hono_1.Hono();
// Serve static files
var STATIC_DIR = path.join(__dirname, "../public");
app.use("*", async function (c, next) {
  try {
    var filePath = path.join(STATIC_DIR, c.req.path === "/" ? "index.html" : c.req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      var ext = path.extname(filePath);
      var types = {".html":"text/html",".js":"application/javascript",".css":"text/css",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon"};
      c.header("Content-Type", types[ext] || "application/octet-stream");
      return c.body(fs.readFileSync(filePath));
    }
  } catch(e) {}
  return next();
});
app.get('/health', function (c) { return c.json({ ok: true }); });
var admin = new hono_1.Hono();
admin.use('*', (0, middleware_js_1.authMiddleware)(getEnv));
(0, auth_js_1.initAuthRoutes)(admin, getEnv);
(0, posts_js_1.initPostRoutes)(admin, getEnv);
(0, gallery_js_1.initGalleryRoutes)(admin, getEnv);
(0, settings_js_1.initSettingsRoutes)(admin, getEnv);
(0, friends_js_1.initFriendsRoutes)(admin, getEnv);
(0, notice_js_1.initNoticeRoutes)(admin, getEnv);
(0, dynamic_js_1.initDynamicRoutes)(admin, getEnv);
(0, siteLinks_js_1.initSiteLinksRoutes)(admin, getEnv);
app.route('/admin', admin);
var PORT = parseInt(process.env.PORT || '3000', 10);
(0, index_js_1.migrate)();
(0, node_server_1.serve)({ fetch: app.fetch, port: PORT });
console.log('Server running on http://localhost:' + PORT);
console.log('Admin panel at http://localhost:' + PORT + '/admin/');
