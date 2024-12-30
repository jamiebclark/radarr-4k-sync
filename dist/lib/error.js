"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMessage = hasMessage;
exports.getMessage = getMessage;
function hasMessage(error) {
    return (typeof error === 'object' && error !== null && 'message' in error && typeof error?.message === 'string');
}
function getMessage(error) {
    return hasMessage(error) ? error.message : '';
}
