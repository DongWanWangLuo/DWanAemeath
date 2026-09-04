"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initGalleryRoutes = initGalleryRoutes;
function initGalleryRoutes(app, getEnv) {
    var _this = this;
    // List albums
    app.get('/albums', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    env = getEnv();
                    return [4 /*yield*/, env.DB.prepare('SELECT * FROM albums ORDER BY updated_at DESC').all()];
                case 1:
                    results = (_a.sent()).results;
                    return [2 /*return*/, c.json({ albums: results || [] })];
            }
        });
    }); });
    // Get album
    app.get('/albums/:slug', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, slug, row, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    env = getEnv();
                    slug = c.req.param('slug');
                    return [4 /*yield*/, env.DB.prepare('SELECT * FROM albums WHERE slug = ?').get(slug)];
                case 1:
                    row = _a.sent();
                    if (!row)
                        return [2 /*return*/, c.json({ error: 'Not found' }, 404)];
                    return [4 /*yield*/, env.DB.prepare('SELECT * FROM album_photos WHERE album_slug = ? ORDER BY sort_order ASC').bind(slug).all()];
                case 2:
                    results = (_a.sent()).results;
                    return [2 /*return*/, c.json({ album: row, photos: results || [] })];
            }
        });
    }); });
    // Create/update album
    app.post('/albums', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, _a, slug, title, desc, date, location, tags, cover, encrypted, password_hint, source, content, photos, tagsJson, i, p;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    env = getEnv();
                    return [4 /*yield*/, c.req.json().catch(function () { return ({}); })];
                case 1:
                    _a = _b.sent(), slug = _a.slug, title = _a.title, desc = _a.desc, date = _a.date, location = _a.location, tags = _a.tags, cover = _a.cover, encrypted = _a.encrypted, password_hint = _a.password_hint, source = _a.source, content = _a.content, photos = _a.photos;
                    if (!slug)
                        return [2 /*return*/, c.json({ error: 'Missing slug' }, 400)];
                    tagsJson = tags ? JSON.stringify(tags) : null;
                    return [4 /*yield*/, env.DB.prepare(INSERT, INTO, albums(slug, title, desc, date, location, tags, cover, encrypted, password_hint, source, content, updated_at), VALUES(datetime('now')), ON, CONFLICT(slug), DO, UPDATE, SET, title = excluded.title, desc = excluded.desc, date = excluded.date, location = excluded.location, tags = excluded.tags, cover = excluded.cover, encrypted = excluded.encrypted, password_hint = excluded.password_hint, source = excluded.source, content = excluded.content, updated_at = datetime('now')).bind(slug, title || '', desc || null, date || null, location || null, tagsJson, cover || null, encrypted ? 1 : 0, password_hint || null, source || 'local', content || '').run()];
                case 2:
                    _b.sent();
                    // Update photos
                    return [4 /*yield*/, env.DB.prepare('DELETE FROM album_photos WHERE album_slug = ?').bind(slug).run()];
                case 3:
                    // Update photos
                    _b.sent();
                    if (!(photos && Array.isArray(photos))) return [3 /*break*/, 7];
                    i = 0;
                    _b.label = 4;
                case 4:
                    if (!(i < photos.length)) return [3 /*break*/, 7];
                    p = photos[i];
                    return [4 /*yield*/, env.DB.prepare('INSERT INTO album_photos (album_slug, url, type, poster, date, sort_order) VALUES (?, ?, ?, ?, ?, ?)').bind(slug, p.url, p.type || null, p.poster || null, p.date || null, i).run()];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/, c.json({ ok: true })];
            }
        });
    }); });
    // Delete album
    app.delete('/albums/:slug', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, slug, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    env = getEnv();
                    slug = c.req.param('slug');
                    return [4 /*yield*/, env.DB.prepare('DELETE FROM album_photos WHERE album_slug = ?').bind(slug).run()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, env.DB.prepare('DELETE FROM albums WHERE slug = ?').bind(slug).run()];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, c.json({ ok: result.meta.changes > 0 })];
            }
        });
    }); });
}
