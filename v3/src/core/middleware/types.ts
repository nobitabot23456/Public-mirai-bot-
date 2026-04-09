// src/core/middleware/types.ts

/**
 * Core types for the Dispatcher middleware pipeline.
 */

import { FBApi, FBEvent } from "../types/api";
import { BotConfig } from "../types/agent";

export interface MiddlewareContext {
  api: FBApi;
  event: FBEvent;
  config: BotConfig;
  body: string;
  /** Signals subsequent middleware to stop executing */
  aborted: boolean;
  abort(): void;
  /** Shared bag for passing data between middleware */
  data: Record<string, any>;
}

export type MiddlewareFn = (
  ctx: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void>;
