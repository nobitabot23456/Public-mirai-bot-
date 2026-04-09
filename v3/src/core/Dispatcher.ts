// src/core/Dispatcher.ts

/**
 * Dispatcher — the single entry point for every FB message event.
 *
 * Builds a Koa-style middleware pipeline and runs it for each event.
 * The pipeline is ordered as follows:
 *
 *  logMiddleware        → structured JSON log
 *  saveMessageMiddleware → persist to STM
 *  cooldownMiddleware   → rate-limit per sender
 *  typingMiddleware     → send typing indicator (wraps remaining steps)
 *  rbacMiddleware       → RBAC gate
 *  commandMiddleware    → match and run bot commands
 *  aiMiddleware         → LangGraph AI pipeline (only if no command matched)
 */

import { getConfig } from "./Config";
import { composePipeline } from "./middleware/pipeline";
import { MiddlewareContext } from "./middleware/types";
import { messageHandler } from "../../handlers/messageHandler";
import {
  logMiddleware,
  saveMessageMiddleware,
  cooldownMiddleware,
  typingMiddleware,
  rbacMiddleware,
  commandMiddleware,
  aiMiddleware,
} from "./middleware/handlers";
import { logger } from "./Logger";

import { metrics } from "./Metrics";

// Build the pipeline once at module load time
const pipeline = composePipeline([
  logMiddleware,
  saveMessageMiddleware,
  cooldownMiddleware,
  typingMiddleware,
  rbacMiddleware,
  commandMiddleware,
  aiMiddleware,
]);

export async function handleMessage(api: any, event: any) {
  const config = getConfig();
  const message = messageHandler({ api, event });
  const body = (message.body || "").trim();

  // Record incoming message metric
  metrics.recordIncomingMessage();

  // Build the shared context object
  const ctx: MiddlewareContext = {
    api,
    event,
    config: config as any,
    body,
    aborted: false,
    abort() { this.aborted = true; },
    data: {},
  };

  try {
    await pipeline(ctx);
  } catch (err) {
    logger.error("DISPATCHER", "Unhandled pipeline error", { error: err });
  }
}
