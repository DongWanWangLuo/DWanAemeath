"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePinOrder = normalizePinOrder;
exports.sortPostsByPinOrder = sortPostsByPinOrder;
function normalizePinOrder(val) {
    var n = Number(val);
    if (isNaN(n))
        return 0;
    return Math.max(0, n);
}
function sortPostsByPinOrder(posts) {
    return __spreadArray([], posts, true).sort(function (a, b) {
        var pa = a.pin_order || 0;
        var pb = b.pin_order || 0;
        if (pa !== pb)
            return pb - pa;
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
}
