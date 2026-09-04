"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUserByUsername = getAdminUserByUsername;
exports.hasAdminUser = hasAdminUser;
exports.createAdminUser = createAdminUser;
exports.updateAdminPassword = updateAdminPassword;
exports.verifyAdminUserCredentials = verifyAdminUserCredentials;
var bcryptjs_1 = require("bcryptjs");
var adminSession_js_1 = require("./adminSession.js");
var BCRYPT_ROUNDS = 10;
async function getAdminUserByUsername(db, username) {
    if (!username) return null;
    const row = await db.prepare("SELECT id, username, password_hash, enabled, created_at, updated_at FROM admin_users WHERE username = ?").bind(username.trim()).get();
    return row || null;
}
async function hasAdminUser(db) {
    const row = await db.prepare("SELECT COUNT(*) AS c FROM admin_users").get();
    return Boolean(row && Number(row.c) > 0);
}
async function verifyAdminUserCredentials(db, username, password) {
    const user = await getAdminUserByUsername(db, username);
    if (!user) return false;
    if (user.enabled !== 1) return false;
    return (await bcryptjs_1.compare(password, user.password_hash));
}
async function createAdminUser(db, username, password) {
    const name = String(username || "").trim();
    if (!name || !password) return { ok: false, conflict: false };
    if (await hasAdminUser(db)) return { ok: false, conflict: true };
    const existing = await getAdminUserByUsername(db, name);
    if (existing) return { ok: false, conflict: true };
    const hash = await adminSession_js_1.hashPassword(password);
    try {
        await db.prepare("INSERT INTO admin_users (username, password_hash, enabled) VALUES (?, ?, 1)").bind(name, hash).run();
        return { ok: true };
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return { ok: false, conflict: true };
        throw e;
    }
}
async function updateAdminPassword(db, username, password) {
    const name = String(username || "").trim();
    if (!name || !password) return false;
    const user = await getAdminUserByUsername(db, name);
    if (!user) return false;
    const hash = await adminSession_js_1.hashPassword(password);
    await db.prepare("UPDATE admin_users SET password_hash = ?, updated_at = datetime('now') WHERE username = ?").bind(hash, name).run();
    return true;
}
