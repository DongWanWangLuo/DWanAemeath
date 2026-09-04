"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeUrl = isSafeUrl;
function isSafeUrl(url) {
    try {
        var u = new URL(url);
        return ['http', 'https'].includes(u.protocol);
    }
    catch (_a) {
        return false;
    }
}
