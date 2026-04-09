// src/core/types/agent.ts

/**
 * Types that describe the AI agent's internal state and context.
 * Used by LangGraph nodes and the memory subsystem.
 */

import { BaseMessage } from "@langchain/core/messages";

export interface AgentContext {
  threadID: string;
  senderID: string;
  senderName?: string;
  isGroup: boolean;
  botID: string;           // The bot's own FB userID
  botName: string;         // Bot's display name (for mention detection)
  replyToMessageID?: string; // If message is a reply, the ID it replies to
  forceRespond: boolean;   // True when a hard signal (DM / reply to bot) was detected
  botConfig: BotConfig;
  commandNames: string[];
  userPermLevel: number;
}

export interface BotConfig {
  BOTNAME: string;
  PREFIX: string;
  rbac: boolean;
  rbacMode: number;
  ADMINBOT?: string[];
  BOTOWNER?: string[];
  debug: boolean;
  aiMinRole: number;
  jailbreak: boolean;
  /**
   * Active persona name. Determines the bot's personality.
   * Options: "anya" (default) | "formal" | "techguru" | "sensei"
   */
  persona?: string;
}

export type Intent =
  | "text"               // General conversation/question
  | "get_help"           // Wants command list/help
  | "get_prefix"         // Asking about prefix
  | "img_gif"            // Image/GIF request
  | "poll"               // Create a poll
  | "command_suggestion" // Describing a command action
  | "manage_group"       // Rename group, change nickname, emoji
  | "react"              // Add emoji reaction
  | "schedule"           // Schedule a message/reminder
  | "search_web"         // Explicit web search request
  | "ignore";            // Not for the bot — DO NOT respond

export interface Classification {
  intent: Intent;
  mood: string;
  lang: "en" | "bn" | "banglish" | "hinglish";
  confidence: number;
  isForBot: boolean;
}

export interface AgentState {
  messages: BaseMessage[];
  classification: Classification;
  context: AgentContext;
  // Additional fields can be added later (e.g., token usage)
}

// Helper type for token usage tracking
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}
