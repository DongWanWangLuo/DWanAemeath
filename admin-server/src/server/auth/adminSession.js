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
exports.BCRYPT_ROUNDS = exports.ADMIN_SESSION_MAX_AGE = exports.ADMIN_SESSION_COOKIE = void 0;
exports.createSessionToken = createSessionToken;
exports.getSessionUser = getSessionUser;
exports.getCookieValue = getCookieValue;
exports.buildSessionCookie = buildSessionCookie;
exports.buildClearSessionCookie = buildClearSessionCookie;
exports.hashPassword = hashPassword;
exports.isBcryptHash = isBcryptHash;
var bcryptjs_1 = require("bcryptjs");
var crypto_1 = require("crypto");
exports.ADMIN_SESSION_COOKIE = 'admin_session';
exports.ADMIN_SESSION_MAX_AGE = 60 * 60 * 4;
exports.BCRYPT_ROUNDS = 10;
function getSecret(env) {
    var _a;
    var secret = (_a = env.SESSION_SECRET) === null || _a === void 0 ? void 0 : _a.trim();
    if (!secret)
        throw new Error('SESSION_SECRET not configured');
    return secret;
}
function b64enc(input) {
    return Buffer.from(input, 'utf8').toString('base64url');
}
function b64dec(input) {
    var normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    var padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
}
function hmacSign(payload, secret) {
    return crypto_1.createHmac('sha256', secret).update(payload).digest('base64url');
}
function createSessionToken(username, env) {
    return __awaiter(this, void 0, void 0, function () {
        var secret, exp, payload, sig;
        return __generator(this, function (_a) {
            secret = getSecret(env);
            exp = Date.now() + exports.ADMIN_SESSION_MAX_AGE * 1000;
            payload = b64enc(JSON.stringify({ u: username, exp: exp }));
            sig = hmacSign(payload, secret);
            return [2 /*return*/, payload + '.' + sig];
        });
    });
}
function getSessionUser(token, env) {
    return __awaiter(this, void 0, void 0, function () {
        var secret, parts, payload, sig, expected, data;
        return __generator(this, function (_a) {
            secret = getSecret(env);
            if (!secret || !token)
                return [2 /*return*/, null];
            parts = token.split('.');
            payload = parts[0];
            sig = parts[1];
            if (!payload || !sig)
                return [2 /*return*/, null];
            expected = hmacSign(payload, secret);
            if (expected !== sig)
                return [2 /*return*/, null];
            try {
                data = JSON.parse(b64dec(payload));
                if (!data.exp || Date.now() > data.exp)
                    return [2 /*return*/, null];
                return [2 /*return*/, data.u || null];
            }
            catch (_b) {
                return [2 /*return*/, null];
            }
            return [2 /*return*/];
        });
    });
}
function getCookieValue(cookieHeader, name) {
    if (!cookieHeader)
        return null;
    for (var _i = 0, _a = cookieHeader.split(';'); _i < _a.length; _i++) {
        var part = _a[_i];
        var _b = part.trim().split('='), rawKey = _b[0], rest = _b.slice(1);
        if (rawKey === name)
            return decodeURIComponent(rest.join('='));
    }
    return null;
}
function buildSessionCookie(token) {
    return exports.ADMIN_SESSION_COOKIE + '=' + encodeURIComponent(token) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + exports.ADMIN_SESSION_MAX_AGE + ';';
}
function buildClearSessionCookie() {
    return exports.ADMIN_SESSION_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;';
}
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, bcryptjs_1.hash(password, exports.BCRYPT_ROUNDS)];
        });
    });
}
function isBcryptHash(password) {
    return (password.indexOf('') === 0) && password.length === 60;
}
