// src/ai/tools/groupTool.ts

/**
 * Group Management Tools — powered by the login/src API.
 *
 * Tools:
 *  1. getThreadInfoTool    — fetch group metadata (name, members, admins)
 *  2. changeGroupNameTool  — rename the group (admin only)
 *  3. setNicknameTool      — set a member's nickname (admin only)
 *  4. createPollTool       — create a poll in the group
 *  5. changeThreadEmojiTool — change the group chat emoji
 *
 * RBAC note: Tools marked (admin only) return an error if the bot
 * is not an admin. The API itself enforces this — the error message
 * is passed back to the LLM gracefully.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withToolMiddleware } from "./middleware";

// ─────────────────────────────────────────────────────────────────────────────
// 1. getThreadInfoTool
// ─────────────────────────────────────────────────────────────────────────────
export const getThreadInfoTool = tool(
  withToolMiddleware(async (_args: Record<string, never>, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    const threadID = event.threadID;

    return new Promise((resolve) => {
      api.getThreadInfo(threadID, (err: any, data: any) => {
        if (err) {
          resolve(`Failed to get thread info: ${JSON.stringify(err)}`);
          return;
        }

        const summary = {
          threadID: data.threadID,
          name: data.threadName || data.name || "(no name)",
          isGroup: data.isGroup,
          memberCount: data.participantIDs?.length ?? 0,
          members: data.userInfo?.map((u: any) => ({
            id: u.id,
            name: u.name,
            firstName: u.firstName,
          })) ?? [],
          adminIDs: data.adminIDs?.map((a: any) => a.id ?? a) ?? [],
          emoji: data.emoji || null,
          unreadCount: data.unreadCount ?? 0,
          canReply: data.canReply ?? true,
          inviteLink: data.inviteLink?.link || null,
        };

        resolve(JSON.stringify(summary, null, 2));
      });
    });
  }, "getThreadInfo"),
  {
    name: "getThreadInfo",
    description:
      "Get detailed information about the current group chat: name, member list, admin IDs, emoji, invite link, and member count. Use this when you need to know who's in the group or group settings.",
    schema: z.object({}),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. changeGroupNameTool
// ─────────────────────────────────────────────────────────────────────────────
export const changeGroupNameTool = tool(
  withToolMiddleware(async ({ newName }: { newName: string }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    return new Promise((resolve) => {
      api.setTitle(newName, event.threadID, (err: any) => {
        if (err) {
          if (err.error?.includes("Not member") || err.error?.includes("cannot")) {
            resolve("Failed: I'm not an admin in this group. Only admins can rename the group.");
          } else {
            resolve(`Failed to rename group: ${JSON.stringify(err)}`);
          }
        } else {
          resolve(`Successfully renamed the group to "${newName}".`);
        }
      });
    });
  }, "changeGroupName"),
  {
    name: "changeGroupName",
    description:
      "Rename the current group chat. Requires bot to be a group admin. Use when user asks to change or set the group name.",
    schema: z.object({
      newName: z.string().min(1).max(500).describe("The new name for the group chat"),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. setNicknameTool
// ─────────────────────────────────────────────────────────────────────────────
export const setNicknameTool = tool(
  withToolMiddleware(
    async (
      { participantID, nickname }: { participantID: string; nickname: string },
      config: any
    ) => {
      const { api, event } = (config as any).configurable;
      if (!api || !event) return "Error: API context not found.";

      return new Promise((resolve) => {
        api.changeNickname(nickname, event.threadID, participantID, (err: any) => {
          if (err) {
            if (err.error?.includes("isn't in thread")) {
              resolve(`Failed: User ${participantID} is not in this thread.`);
            } else {
              resolve(`Failed to set nickname: ${JSON.stringify(err)}`);
            }
          } else {
            const action = nickname
              ? `Successfully set ${participantID}'s nickname to "${nickname}".`
              : `Successfully cleared ${participantID}'s nickname.`;
            resolve(action);
          }
        });
      });
    },
    "setNickname"
  ),
  {
    name: "setNickname",
    description:
      "Set or clear a member's nickname in the group chat. Pass an empty string to clear the nickname. Use when user asks to nickname or rename a group member.",
    schema: z.object({
      participantID: z.string().describe("The user ID of the person to nickname"),
      nickname: z
        .string()
        .describe("The new nickname. Pass an empty string '' to clear/reset the nickname."),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. createPollTool
// ─────────────────────────────────────────────────────────────────────────────
export const createPollTool = tool(
  withToolMiddleware(
    async (
      { question, options }: { question: string; options: string[] },
      config: any
    ) => {
      const { api, event } = (config as any).configurable;
      if (!api || !event) return "Error: API context not found.";

      // Build options object: { "option text": false } (none pre-selected)
      const optionsObj: Record<string, boolean> = {};
      options.forEach((opt) => {
        optionsObj[opt] = false;
      });

      return new Promise((resolve) => {
        api.createPoll(question, event.threadID, optionsObj, (err: any) => {
          if (err) {
            resolve(`Failed to create poll: ${JSON.stringify(err)}`);
          } else {
            resolve(
              `Poll created successfully!\nQuestion: "${question}"\nOptions: ${options.map((o) => `"${o}"`).join(", ")}`
            );
          }
        });
      });
    },
    "createPoll"
  ),
  {
    name: "createPoll",
    description:
      "Create a poll in the current group chat with a question and list of answer options. Use when user asks to make a poll or vote.",
    schema: z.object({
      question: z.string().min(1).describe("The poll question"),
      options: z
        .array(z.string().min(1))
        .min(2)
        .max(10)
        .describe("List of answer options (2-10 options)"),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. changeThreadEmojiTool
// ─────────────────────────────────────────────────────────────────────────────
export const changeThreadEmojiTool = tool(
  withToolMiddleware(async ({ emoji }: { emoji: string }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    return new Promise((resolve) => {
      api.changeThreadEmoji(emoji, event.threadID, (err: any) => {
        if (err) {
          resolve(`Failed to change emoji: ${JSON.stringify(err)}`);
        } else {
          resolve(`Successfully changed the group emoji to ${emoji}`);
        }
      });
    });
  }, "changeThreadEmoji"),
  {
    name: "changeThreadEmoji",
    description:
      "Change the group chat's emoji (the one that shows up next to the chat name). Use a single emoji character.",
    schema: z.object({
      emoji: z
        .string()
        .max(8)
        .describe("A single emoji character to set as the group emoji (e.g., '🔥', '❤️', '🎉')"),
    }),
  }
);
