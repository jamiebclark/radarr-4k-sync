"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
function getEnv(value, label = 'Env var') {
    if (!value) {
        throw new Error(`Environment Variable ${label} not found`);
    }
    return value;
}
