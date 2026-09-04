"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
var adminSession_js_1 = require("./adminSession.js");
function authMiddleware(getEnv) {
    return async function authMiddleware(c, next) {
        var env = getEnv();
        var cookieHeader = c.req.header('Cookie');
        var token = (0, adminSession_js_1.getCookieValue)(cookieHeader, 'admin_session');
        // Public routes - skip auth
        if (c.req.path === '/login' || c.req.path === '/init-admin' || c.req.path === '/change-password' || c.req.path === '/admin/login' || c.req.path === '/admin/init-admin' || c.req.path === '/admin/change-password') {
            return next();
        }
        // Session check route
        if (c.req.path === '/session' || c.req.path === '/admin/session') {
            var decodedUser = null;
            if (token) {
                try { decodedUser = await (0, adminSession_js_1.getSessionUser)(token, env); } catch(e) {}
            }
            return c.json(decodedUser ? { authenticated: true, username: decodedUser } : { authenticated: false });
        }
        // All other routes require auth
        if (!token) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        var username = null;
        try {
            username = await (0, adminSession_js_1.getSessionUser)(token, env);
        } catch (e) { }
        if (!username) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        var row = env.DB.prepare('SELECT enabled FROM admin_users WHERE username = ?').get(username);
        if (row && row.enabled !== 1) {
            c.header('Set-Cookie', (0, adminSession_js_1.buildClearSessionCookie)());
            return c.json({ error: 'Account disabled' }, 403);
        }
        c.set('username', username);
        return next();
    };
}
