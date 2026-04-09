// src/ai/tools/threadTool.ts

/**
 * Thread Utility Tools — powered by login/src API.
 *
 * Tools:
 *  1. markAsReadTool    — mark the current thread as read
 *  2. shareContactTool  — share a user's profile as a contact card
 *
 * These are lightweight but genuinely useful for group management
 * and social interactions.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withToolMiddleware } from "./middleware";

// ─────────────────────────────────────────────────────────────────────────────
// 1. markAsReadTool
// ─────────────────────────────────────────────────────────────────────────────
export const markAsReadTool = tool(
  withToolMiddleware(async (_args: Record<string, never>, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    return new Promise((resolve) => {
      api.markAsRead(event.threadID, (err: any) => {
        if (err) {
          resolve(`Failed to mark as read: ${JSON.stringify(err)}`);
        } else {
          resolve("Thread marked as read.");
        }
      });
    });
  }, "markAsRead"),
  {
    name: "markAsRead",
    description:
      "Mark the current thread/chat as read. Clears unread message count. Use when user asks the bot to mark as read or acknowledge messages.",
    schema: z.object({}),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. shareContactTool
// ─────────────────────────────────────────────────────────────────────────────
export const shareContactTool = tool(
  withToolMiddleware(async ({ userID }: { userID: string }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    return new Promise((resolve) => {
      // shareContact sends a contact card in thread
      api.shareContact(userID, event.threadID, (err: any) => {
        if (err) {
          // Graceful fallback: fetch user info and report it as text
          api.getUserInfo([userID], (infoErr: any, data: any) => {
            if (infoErr) {
              resolve(`Failed to share contact and could not fetch user info for ${userID}.`);
            } else {
              const user = data?.[userID];
              if (user) {
                resolve(
                  `Could not send contact card, but here's the info:\nName: ${user.name}\nProfile: ${user.profileUrl || "N/A"}`
                );
              } else {
                resolve(`Failed to share contact for user ${userID}: ${JSON.stringify(err)}`);
              }
            }
          });
        } else {
          resolve(`Successfully shared the contact card for user ${userID}.`);
        }
      });
    });
  }, "shareContact"),
  {
    name: "shareContact",
    description:
      "Share a user's profile/contact card in the current chat. Use when user wants to share someone's profile or introduce them to the group.",
    schema: z.object({
      userID: z.string().describe("The Facebook user ID of the person to share as a contact"),
    }),
  }
);
