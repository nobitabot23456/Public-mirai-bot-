// src/core/types/api.ts

/**
 * Strongly typed definitions for the Facebook Chat API used by Cyber‑Bot.
 * Replaces the previous `any` usage throughout the codebase.
 */

export interface FBApi {
  /** Send a message (text or rich payload) */
  sendMessage(
    msg: string | MessagePayload,
    threadID: string,
    callback: FBCallback,
    replyTo?: string | null
  ): void;

  /** Add a reaction (emoji) to a message */
  setMessageReaction(
    emoji: string,
    messageID: string,
    callback: FBCallback
  ): void;

  /** Delete a message for everyone */
  unsendMessage(messageID: string, callback: FBCallback): void;

  /** Get the bot's own user ID */
  getCurrentUserID(): string;

  /** Configure the API (e.g., listen events) */
  setOptions(opts: FBOptions): void;

  /** Listen for incoming MQTT events */
  listenMqtt(
    callback: (err: Error | null, event: FBEvent) => void
  ): void;

  /** Send a typing indicator – returns a stop function */
  sendTypingIndicator(
    threadID: string,
    callback: FBCallback
  ): () => void;

  /** Retrieve basic user info for one or more IDs */
  getUserInfo(
    userIDs: string[],
    callback: (err: Error | null, data: Record<string, UserInfo>) => void
  ): void;
}

/** Payload for rich messages (attachments, mentions, etc.) */
export interface MessagePayload {
  body?: string;
  attachment?: any; // Stream or Buffer – concrete type depends on the FB SDK version
  mentions?: Mention[];
}

/** Simple callback used by the FB SDK */
export type FBCallback = (err: Error | null, info?: any) => void;

/** Options passed to `setOptions` */
export interface FBOptions {
  listenEvents?: boolean;
  selfListen?: boolean;
  // Additional options can be added here as needed
}

/** Event emitted by the FB API (message, reply, etc.) */
export interface FBEvent {
  type: string; // e.g., "message", "message_reply", etc.
  messageID: string;
  threadID: string;
  senderID: string;
  body: string;
  timestamp: number;
  attachments?: Attachment[];
  mentions?: Record<string, string>;
  messageReply?: FBEvent; // Nested reply event if present
  isGroup?: boolean;
}

/** Attachment metadata */
export interface Attachment {
  type: string; // "photo", "video", etc.
  url: string;
  // Additional fields can be added based on the SDK version
}

/** Mention information */
export interface Mention {
  tag: string; // The @‑tag text that appears in the message
  id: string; // The user ID being mentioned
}

/** Basic user profile information */
export interface UserInfo {
  name: string;
  firstName?: string;
  lastName?: string;
  profilePicUrl?: string;
  // Extend as required
}

/** Export a convenient type that bundles the API and the current event */
export interface FBContext {
  api: FBApi;
  event: FBEvent;
}
