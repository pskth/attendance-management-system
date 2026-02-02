// src/lib/request-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export type RequestContext = {
    id: string;
    startTime: number;
    queryCount: number;
    method: string;
    path: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
    run<T>(ctx: RequestContext, fn: () => T): T {
        return storage.run(ctx, fn);
    },
    get(): RequestContext | undefined {
        return storage.getStore();
    }
};

export function createRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
