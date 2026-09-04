import { Hono } from "hono";
import type { Env } from "./db";
import { authMiddleware } from "./middleware";
import { initAuthRoutes } from "./routes/auth";
import { initPostRoutes } from "./routes/posts";
import { initGalleryRoutes, initFriendsRoutes } from "./routes/gallery";
import { initNoticeRoutes, initDynamicRoutes } from "./routes/notice";
import { initSettingsRoutes, initSiteLinksRoutes } from "./routes/settings";
import { getEnv } from "./db";

const ADMIN_PANEL_HTML = @$htmlEscaped@;

const app = new Hono<{ Bindings: Env }>();

// Admin panel SPA
app.get("/admin", (c) => c.html(ADMIN_PANEL_HTML));
app.get("/admin/", (c) => c.html(ADMIN_PANEL_HTML));
app.get("/admin/login", (c) => c.html(ADMIN_PANEL_HTML));
app.get("/admin/*", (c) => c.html(ADMIN_PANEL_HTML));

app.get("/health", (c) => c.json({ ok: true }));

const admin = new Hono<{ Bindings: Env }>();
admin.use("*", authMiddleware(getEnv));
initAuthRoutes(admin, getEnv);
initPostRoutes(admin, getEnv);
initGalleryRoutes(admin, getEnv);
initFriendsRoutes(admin, getEnv);
initNoticeRoutes(admin, getEnv);
initDynamicRoutes(admin, getEnv);
initSettingsRoutes(admin, getEnv);
initSiteLinksRoutes(admin, getEnv);
app.route("/admin", admin);

export default app;
