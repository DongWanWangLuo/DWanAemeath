"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constantTimeEqual = constantTimeEqual;
function constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string')
        return false;
    if (a.length !== b.length)
        return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
