// src/core/middleware/pipeline.ts

/**
 * Compose a list of middleware functions into a single executable pipeline,
 * Koa-style.  Each middleware receives `ctx` and `next`, and must call
 * `next()` to pass control to the subsequent step.
 */

import { MiddlewareContext, MiddlewareFn } from "./types";

export function composePipeline(middlewares: MiddlewareFn[]) {
  return async function execute(ctx: MiddlewareContext): Promise<void> {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (ctx.aborted) return;
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const fn = middlewares[i];
      if (!fn) return;
      await fn(ctx, () => dispatch(i + 1));
    }

    await dispatch(0);
  };
}
