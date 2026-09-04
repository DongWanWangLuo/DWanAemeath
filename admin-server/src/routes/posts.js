"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.initPostRoutes = initPostRoutes;
var FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
function parseFrontmatter(source) {
    var match = source.match(FRONTMATTER_RE);
    if (!match)
        return { frontmatter: {}, content: source };
    var fmStr = match[1];
    var content = match[2];
    var frontmatter = parseSimpleYaml(fmStr);
    return { frontmatter: frontmatter, content: content };
}
function parseSimpleYaml(yaml) {
    var result = {};
    var currentKey = null;
    var listItems = null;
    function flushList() {
        if (currentKey && listItems)
            result[currentKey] = listItems;
        listItems = null;
    }
    for (var _i = 0, _a = yaml.split(/\r?\n/); _i < _a.length; _i++) {
        var rawLine = _a[_i];
        var line = rawLine.trimEnd();
        if (!line.trim() || line.trim().startsWith('#'))
            continue;
        var listMatch = line.match(/^\s*-\s+(.+)$/);
        if (listMatch && listItems) {
            listItems.push(unquote(listMatch[1].trim()));
            continue;
        }
        flushList();
        var kvMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!kvMatch)
            continue;
        var key = kvMatch[1];
        var value = kvMatch[2].trim();
        currentKey = key;
        if (!value) {
            listItems = [];
            continue;
        }
        result[key] = parseScalar(value);
    }
    flushList();
    return result;
}
function unquote(value) {
    if ((value.startsWith('\\ ) && value.endsWith( \\')) || (value.startsWith(") && value.endsWith("))) {
        return value.slice(1, -1);
    }
    return value;
}
function parseScalar(value) {
    var unquoted = unquote(value);
    if (unquoted === 'true')
        return true;
    if (unquoted === 'false')
        return false;
    var num = Number(unquoted);
    if (!isNaN(num) && isFinite(num))
        return num;
    return unquoted;
}
function encodePostPath(slug) {
    return '/posts/' + encodeURIComponent(slug);
}
function decodePostSlug(path) {
    return decodeURIComponent(path.split('/').pop() || path);
}
function initPostRoutes(app, getEnv) {
    var _this = this;
    // List posts
    app.get('/posts', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, page, pageSize, offset, results, countRow, total;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    env = getEnv();
                    page = Math.max(1, parseInt(c.req.query('page') || '1'));
                    pageSize = Math.min(200, Math.max(1, parseInt(c.req.query('pageSize') || '20')));
                    offset = (page - 1) * pageSize;
                    return [4 /*yield*/, env.DB.prepare('SELECT * FROM posts WHERE published = 1 ORDER BY pin_order DESC, date DESC LIMIT ? OFFSET ?').bind(pageSize, offset).all()];
                case 1:
                    results = (_a.sent());
                    return [4 /*yield*/, env.DB.prepare('SELECT COUNT(*) AS total FROM posts WHERE published = 1').get()];
                case 2:
                    countRow = _a.sent();
                    total = (countRow === null || countRow === void 0 ? void 0 : countRow.total) || 0;
                    return [2 /*return*/, c.json({ posts: (results || []).map(function (r) { return (__assign(__assign({}, r), { path: encodePostPath(r.slug) })); }), total: total, page: page, pageSize: pageSize })];
            }
        });
    }); });
    // Get post
    app.get('/posts/:slug', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, slug, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    env = getEnv();
                    slug = decodePostSlug(c.req.param('slug'));
                    return [4 /*yield*/, env.DB.prepare('SELECT * FROM posts WHERE slug = ?').get(slug)];
                case 1:
                    row = _a.sent();
                    if (!row)
                        return [2 /*return*/, c.json({ error: 'Not found' }, 404)];
                    return [2 /*return*/, c.json(row)];
            }
        });
    }); });
    // Create/update post
    app.post('/posts', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, _a, slug, source, _b, frontmatter, content, decodedSlug, published, pinOrder, categories, tags;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    env = getEnv();
                    return [4 /*yield*/, c.req.json().catch(function () { return ({}); })];
                case 1:
                    _a = _d.sent(), slug = _a.slug, source = _a.source;
                    if (!source)
                        return [2 /*return*/, c.json({ error: 'Missing source' }, 400)];
                    _b = parseFrontmatter(source), frontmatter = _b.frontmatter, content = _b.content;
                    decodedSlug = slug || frontmatter.slug || ((_c = frontmatter.title) === null || _c === void 0 ? void 0 : _c.replace(/\s+/g, '-').toLowerCase());
                    if (!decodedSlug)
                        return [2 /*return*/, c.json({ error: 'Missing slug' }, 400)];
                    published = frontmatter.published ? 1 : 0;
                    pinOrder = Number(frontmatter.pin_order || frontmatter.pinned ? 1 : 0);
                    categories = frontmatter.category ? [String(frontmatter.category)] : [];
                    tags = frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [String(frontmatter.tags)]) : [];
                    return [4 /*yield*/, env.DB.prepare("INSERT INTO posts (slug, title, excerpt, description, date, published, fm_json, categories, tags, pin_order, r2_key, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(slug) DO UPDATE SET title = excluded.title, excerpt = excluded.excerpt, description = excluded.description, date = excluded.date, published = excluded.published, fm_json = excluded.fm_json, categories = excluded.categories, tags = excluded.tags, pin_order = excluded.pin_order, r2_key = excluded.r2_key, updated_at = datetime('now')").bind(decodedSlug, String(frontmatter.title || ''), frontmatter.excerpt || null, frontmatter.description || null, frontmatter.date || new Date().toISOString().slice(0, 10), published, JSON.stringify(frontmatter), categories.length ? JSON.stringify(categories) : null, tags.length ? JSON.stringify(tags) : null, pinOrder, 'local:' + decodedSlug).run()];
                case 2:
                    _d.sent();
                    return [2 /*return*/, c.json({ ok: true, slug: decodedSlug })];
            }
        });
    }); });
    // Delete post
    app.delete('/posts/:slug', function (c) { return __awaiter(_this, void 0, void 0, function () {
        var env, slug, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    env = getEnv();
                    slug = decodePostSlug(c.req.param('slug'));
                    return [4 /*yield*/, env.DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug).run()];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, c.json({ ok: result.meta.changes > 0 })];
            }
        });
    }); });
}
