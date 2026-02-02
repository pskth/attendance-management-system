"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContext = void 0;
exports.createRequestId = createRequestId;
// src/lib/request-context.ts
const async_hooks_1 = require("async_hooks");
const storage = new async_hooks_1.AsyncLocalStorage();
exports.requestContext = {
    run(ctx, fn) {
        return storage.run(ctx, fn);
    },
    get() {
        return storage.getStore();
    }
};
function createRequestId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
