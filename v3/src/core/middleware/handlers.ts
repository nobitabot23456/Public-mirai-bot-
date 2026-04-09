// src/core/middleware/handlers.ts

/**
 * Individual middleware handlers used by the Dispatcher pipeline.
 *
 *  1. logMiddleware        – structured log of every incoming message
 *  2. saveMessageMiddleware – persist message to STM
 *  3. cooldownMiddleware   – per-user cooldown (prevents spam)
 *  4. typingMiddleware     – send typing indicator while AI processes
 *  5. rbacMiddleware       – block users below the minimum RBAC level
 *  6. commandMiddleware    – run matched bot commands
 *  7. aiMiddleware         – fall-through to the LangGraph AI pipeline
 */

import { MiddlewareFn } from "./types";
import { logger } from "../Logger";
import { db } from "../Database";
import { getPermissionLevel } from "../RBAC";
import { commands, aliases } from "../Loader";
import { getConfig, saveConfig } from "../Config";
import { messageHandler } from "../../../handlers/messageHandler";
import { chat } from "../../ai";
import { botMemory } from "../BotMemory";

// --------------------------------------------------------------------------
// 1. Structured logging
// --------------------------------------------------------------------------
export const logMiddleware: MiddlewareFn = async (ctx, next) => {
  if (ctx.body) {
    logger.info("MSG", "Incoming message", {
      sender: ctx.event.senderID,
      thread: ctx.event.threadID,
      body: ctx.body.substring(0, 80),
    });
  }
  await next();
};

// --------------------------------------------------------------------------
// 2. Persist message to STM
// --------------------------------------------------------------------------
export const saveMessageMiddleware: MiddlewareFn = async (ctx, next) => {
  try {
    await db.saveMessage({
      messageID: ctx.event.messageID,
      threadID: ctx.event.threadID,
      senderID: ctx.event.senderID,
      body: ctx.body,
      timestamp: ctx.event.timestamp,
      replyToID: ctx.event.messageReply?.messageID,
      meta: {
        attachments: ctx.event.attachments?.length || 0,
        mentions: ctx.event.mentions ? Object.keys(ctx.event.mentions) : [],
      },
    });
  } catch (e) {
    logger.error("DB", "Failed to save message", { error: e });
  }
  await next();
};

// --------------------------------------------------------------------------
// 3. Per-user cooldown (1.5 s between messages)
// --------------------------------------------------------------------------
const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 1500;

export const cooldownMiddleware: MiddlewareFn = async (ctx, next) => {
  const key = `${ctx.event.senderID}:${ctx.event.threadID}`;
  const last = cooldownMap.get(key) ?? 0;
  const now = Date.now();

  if (now - last < COOLDOWN_MS) {
    logger.debug("COOLDOWN", "Throttled", { sender: ctx.event.senderID, wait: COOLDOWN_MS - (now - last) });
    ctx.abort();
    return;
  }
  cooldownMap.set(key, now);
  await next();
};

// --------------------------------------------------------------------------
// 4. Typing indicator while AI processes
// --------------------------------------------------------------------------
export const typingMiddleware: MiddlewareFn = async (ctx, next) => {
  let stopTyping: (() => void) | null = null;

  try {
    stopTyping = ctx.api.sendTypingIndicator(ctx.event.threadID, () => {});
  } catch (_) {}

  try {
    await next();
  } finally {
    try { stopTyping?.(); } catch (_) {}
  }
};

// --------------------------------------------------------------------------
// 5. RBAC gate
// --------------------------------------------------------------------------
export const rbacMiddleware: MiddlewareFn = async (ctx, next) => {
  const { config } = ctx;
  if (!config.rbac) { await next(); return; }

  const permissionLevel = getPermissionLevel(ctx.event.senderID);
  const rbacMode = config.rbacMode ?? 0;
  const message = messageHandler({ api: ctx.api, event: ctx.event });

  if (rbacMode === 2 && permissionLevel < 2) {
    ctx.abort(); return;
  }
  if (rbacMode === 1 && permissionLevel < 1) {
    ctx.abort(); return;
  }

  // Store resolved level for downstream middleware
  ctx.data.permissionLevel = permissionLevel;
  await next();
};

// --------------------------------------------------------------------------
// 6. Command dispatcher
// --------------------------------------------------------------------------
export const commandMiddleware: MiddlewareFn = async (ctx, next) => {
  const config = getConfig();
  const prefix = config.PREFIX || "!";
  const body = ctx.body;
  const permissionLevel: number = ctx.data.permissionLevel ?? getPermissionLevel(ctx.event.senderID);
  const message = messageHandler({ api: ctx.api, event: ctx.event });

  let cmdName: string | undefined;
  let isPrefixed = false;

  if (body.startsWith(prefix)) {
    cmdName = body.slice(prefix.length).trim().split(/\s+/)[0]?.toLowerCase();
    isPrefixed = true;
  } else {
    cmdName = body.split(/\s+/)[0]?.toLowerCase();
  }

  if (!cmdName) { await next(); return; }

  const primaryName = aliases.get(cmdName) || cmdName;
  const command = commands.get(primaryName);

  if (!command) { await next(); return; }

  const usePrefix = command.config.usePrefix !== false;
  const cmdMatches = (isPrefixed && usePrefix) || (!isPrefixed && !usePrefix);
  if (!cmdMatches) { await next(); return; }

  // RBAC per-command
  const hasPermission = command.config.hasPermission || 0;
  if (permissionLevel < hasPermission) {
    message.reply(`❌ You don't have permission to use "${primaryName}". Requires level ${hasPermission}.`);
    ctx.abort(); return;
  }

  logger.info("CMD", `Running command ${primaryName}`, { permissionLevel });

  try {
    const args = body.trim().split(/\s+/).slice(1);
    await command.run({ api: ctx.api, event: ctx.event, message, config, saveConfig, commands, args });
  } catch (error) {
    logger.error("CMD", `Command ${primaryName} failed`, { error });
  }

  // Command matched – do NOT call next() so the AI is skipped
  ctx.data.commandMatched = true;
};

// --------------------------------------------------------------------------
// 7. AI (LangGraph) pipeline
// --------------------------------------------------------------------------
export const aiMiddleware: MiddlewareFn = async (ctx, next) => {
  // Skip if a command already handled this message
  if (ctx.data.commandMatched) { await next(); return; }
  // Skip self-messages
  if (ctx.event.senderID === ctx.api.getCurrentUserID()) { await next(); return; }
  // Skip empty body
  if (!ctx.body) { await next(); return; }

  const config = getConfig();
  const permissionLevel: number = ctx.data.permissionLevel ?? getPermissionLevel(ctx.event.senderID);
  const aiMinRole = (config as any).aiMinRole ?? 0;

  if (permissionLevel < aiMinRole) { await next(); return; }

  // ── Eligibility Check ─────────────────────────────────────────────
  // Only trigger AI if: Admin/Owner, or DM, or Mention, or Reply to Bot
  const isEligible = (permissionLevel > 0) || botMemory.shouldAlwaysRespond({
    isGroup: !!ctx.event.isGroup,
    replyToMessageID: ctx.event.messageReply?.messageID,
    threadID: ctx.event.threadID,
    messageBody: ctx.body,
    botName: config.BOTNAME || "Bela",
  });

  if (!isEligible) {
    logger.debug("AI", "Silent skip – message not eligible for AI chat", { 
      thread: ctx.event.threadID,
      sender: ctx.event.senderID 
    });
    await next();
    return;
  }
  // ──────────────────────────────────────────────────────────────────

  try {
    const history = await db.getHistory(ctx.event.threadID, 15);
    const { response, classification } = await chat(
      ctx.body,
      ctx.event.threadID,
      ctx.api,
      ctx.event,
      config,
      Array.from(commands.keys()),
      permissionLevel,
      history
    );

    logger.info("AI", "Classification", {
      intent: classification.intent,
      mood: classification.mood,
      lang: classification.lang,
    });

    const finalReply = response.replace(/\[.*?\]/g, "").trim();
    if (finalReply && classification.intent !== "ignore") {
      const message = messageHandler({ api: ctx.api, event: ctx.event });
      const sentMsg = await message.reply(finalReply) as any;
      
      // Record the sent message ID so future replies-to-this-message
      // trigger a guaranteed response (Tier-1 forceRespond signal)
      if (sentMsg?.messageID) {
        botMemory.recordBotMessage(ctx.event.threadID, sentMsg.messageID as string);
        logger.debug("BOT_MEMORY", "Recorded bot message", { 
          threadID: ctx.event.threadID, 
          messageID: sentMsg.messageID 
        });
      }
    }
  } catch (error) {
    logger.error("AI", "Pipeline error", { error });
  }

  await next();
};
