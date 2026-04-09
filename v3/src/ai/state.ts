// src/ai/state.ts

import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { Classification } from "../core/types/agent";

/**
 * AgentStateAnnotation defines the shape of the LangGraph state.
 * It extends the default MessagesAnnotation with additional fields.
 */
export const AgentStateAnnotation = Annotation.Root({
  // Preserve the message history
  ...MessagesAnnotation.spec,

  // Classification result from the classifier node
  classification: Annotation<Classification>({
    reducer: (prev, next) => next ?? prev,
    default: () => ({
      intent: "text",
      mood: "neutral",
      lang: "en",
      confidence: 0,
      isForBot: true,
    }),
  }),

  // Additional context (thread, user, config, etc.)
  context: Annotation<any>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),

  // Memory context from memoryFetchNode
  memoryContext: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),

  // Token usage tracking for observability
  tokenUsage: Annotation<any>({
    reducer: (prev, next) => ({
      promptTokens: (prev?.promptTokens || 0) + (next?.promptTokens || 0),
      completionTokens: (prev?.completionTokens || 0) + (next?.completionTokens || 0),
    }),
    default: () => ({ promptTokens: 0, completionTokens: 0 }),
  }),

  /**
   * forceRespond: Set to true when a hard signal (DM, reply-to-bot, or
   * direct name mention) means we bypass the classifier confidence check.
   */
  forceRespond: Annotation<boolean>({
    reducer: (prev, next) => next ?? prev,
    default: () => false,
  }),
});

// Export a convenient type for the compiled state
export type AgentState = typeof AgentStateAnnotation.State;
