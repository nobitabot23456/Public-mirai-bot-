// src/ai/tools/adminTool.ts

/**
 * Admin-level Group Management Tools — powered by login/src API.
 *
 * Tools (all require bot to be a group admin):
 *  1. addMemberTool       — add a user to the group
 *  2. kickMemberTool      — remove a user from the group
 *  3. setAdminTool        — promote/demote a user as group admin
 *  4. changeThreadColorTool — change the group chat color theme
 *  5. muteThreadTool      — mute/unmute the current thread
 *  6. createGroupTool     — create a new group chat
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withToolMiddleware } from "./middleware";

// Thread color presets from threadColors.js
const THREAD_COLORS: Record<string, string> = {
  default:  "196241301102133",
  pink:     "2442142322678320",
  purple:   "2443490819084521",
  green:    "2457013734537557",
  orange:   "175615189761153",
  red:      "2859884484043654",
  blue:     "2058653964378545",
  yellow:   "174636906462322",
  aqua:     "417639218648241",
  teal:     "1928399724138152",
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. addMemberTool
// ─────────────────────────────────────────────────────────────────────────────
export const addMemberTool = tool(
  withToolMiddleware(async ({ userID }: { userID: string }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    return new Promise((resolve) => {
      api.addUserToGroup(userID, event.threadID, (err: any) => {
        if (err) {
          const msg = err.error || JSON.stringify(err);
          resolve(`Failed to add user: ${msg}`);
        } else {
          resolve(`Successfully added user ${userID} to the group.`);
        }
      });
    });
  }, "addMember"),
  {
    name: "addMember",
    description:
      "Add a user to the current group chat using their Facebook user ID. Requires bot to be a group admin.",
    schema: z.object({
      userID: z.string().describe("The Facebook user ID of the person to add to the group"),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. kickMemberTool
// ─────────────────────────────────────────────────────────────────────────────
export const kickMemberTool = tool(
  withToolMiddleware(async ({ userID }: { userID: string }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    // Safety: never kick the bot itself
    const botID = api.getCurrentUserID();
    if (userID === botID) return "I can't remove myself from the group.";

    return new Promise((resolve) => {
      api.removeUserFromGroup(userID, event.threadID, (err: any) => {
        if (err) {
          resolve(`Failed to remove user: ${err.error || JSON.stringify(err)}`);
        } else {
          resolve(`Successfully removed user ${userID} from the group.`);
        }
      });
    });
  }, "kickMember"),
  {
    name: "kickMember",
    description:
      "Remove/kick a user from the current group chat. Requires the bot to be a group admin.",
    schema: z.object({
      userID: z.string().describe("The Facebook user ID of the person to kick from the group"),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. setAdminTool
// ─────────────────────────────────────────────────────────────────────────────
export const setAdminTool = tool(
  withToolMiddleware(
    async ({ userID, promote }: { userID: string; promote: boolean }, config: any) => {
      const { api, event } = (config as any).configurable;
      if (!api || !event) return "Error: API context not found.";

      return new Promise((resolve) => {
        api.changeAdminStatus(event.threadID, userID, promote, (err: any) => {
          if (err) {
            const msg = err.error || JSON.stringify(err);
            resolve(`Failed to change admin status: ${msg}`);
          } else {
            const action = promote ? "promoted to admin" : "removed from admin";
            resolve(`User ${userID} has been ${action}.`);
          }
        });
      });
    },
    "setAdmin"
  ),
  {
    name: "setAdmin",
    description:
      "Promote or demote a group member's admin status. Set promote=true to make admin, false to remove admin. Requires bot to be a group admin.",
    schema: z.object({
      userID: z.string().describe("The Facebook user ID of the group member"),
      promote: z.boolean().describe("true to promote to admin, false to demote from admin"),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. changeThreadColorTool
// ─────────────────────────────────────────────────────────────────────────────
export const changeThreadColorTool = tool(
  withToolMiddleware(async ({ color }: { color: string }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    // Resolve color name → theme ID, or use raw value
    const themeID = THREAD_COLORS[color.toLowerCase()] ?? color;

    return new Promise((resolve) => {
      api.changeThreadColor(themeID, event.threadID, (err: any) => {
        if (err) {
          resolve(
            `Failed to change color. Tip: valid color names are: ${Object.keys(THREAD_COLORS).join(", ")}`
          );
        } else {
          resolve(`Successfully changed the group chat color to "${color}".`);
        }
      });
    });
  }, "changeThreadColor"),
  {
    name: "changeThreadColor",
    description:
      "Change the color theme of the current group chat. Use color names like pink, purple, green, orange, red, blue, yellow, aqua, teal, or default.",
    schema: z.object({
      color: z
        .string()
        .describe(
          "Color name: pink, purple, green, orange, red, blue, yellow, aqua, teal, default — or a raw theme ID string"
        ),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. muteThreadTool
// ─────────────────────────────────────────────────────────────────────────────
export const muteThreadTool = tool(
  withToolMiddleware(async ({ muteSeconds }: { muteSeconds: number }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    return new Promise((resolve) => {
      // muteSeconds: -1 = mute forever, 0 = unmute, positive = mute duration
      api.muteThread(event.threadID, muteSeconds, (err: any) => {
        if (err) {
          resolve(`Failed to mute thread: ${JSON.stringify(err)}`);
        } else {
          if (muteSeconds === 0) {
            resolve("Successfully unmuted the thread.");
          } else if (muteSeconds === -1) {
            resolve("Thread muted indefinitely.");
          } else {
            resolve(`Thread muted for ${muteSeconds} seconds.`);
          }
        }
      });
    });
  }, "muteThread"),
  {
    name: "muteThread",
    description:
      "Mute or unmute the current thread. Pass muteSeconds=0 to unmute, -1 to mute forever, or a positive number for timed mute (e.g. 3600 = 1 hour).",
    schema: z.object({
      muteSeconds: z
        .number()
        .describe("0 = unmute | -1 = mute forever | positive number = mute duration in seconds"),
    }),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. createGroupTool
// ─────────────────────────────────────────────────────────────────────────────
export const createGroupTool = tool(
  withToolMiddleware(
    async (
      { title, participantIDs }: { title: string; participantIDs: string[] },
      config: any
    ) => {
      const { api } = (config as any).configurable;
      if (!api) return "Error: API context not found.";

      return new Promise((resolve) => {
        api.createNewGroup(participantIDs, title, (err: any, threadID: any) => {
          if (err) {
            resolve(`Failed to create group: ${err.error || JSON.stringify(err)}`);
          } else {
            resolve(`New group "${title}" created successfully! Thread ID: ${threadID}`);
          }
        });
      });
    },
    "createGroup"
  ),
  {
    name: "createGroup",
    description:
      "Create a new group chat with the given title and list of participant user IDs. The bot will be added automatically.",
    schema: z.object({
      title: z.string().min(1).describe("The name for the new group"),
      participantIDs: z
        .array(z.string())
        .min(1)
        .describe("List of Facebook user IDs to add to the new group"),
    }),
  }
);
