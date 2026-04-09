// src/ai/tools/socialTool.ts

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withToolMiddleware } from "./middleware";

/**
 * Tool to fetch user information (name, first name, profile pic, etc.)
 * by one or more user IDs.
 */
export const getUserInfoTool = tool(
  withToolMiddleware(async ({ userIDs }: { userIDs: string[] }, config: any) => {
    const { api } = (config as any).configurable;
    if (!api) return "Error: API context not found.";

    return new Promise((resolve) => {
      api.getUserInfo(userIDs, (err: any, data: any) => {
        if (err) {
          resolve(`Failed to fetch user info: ${JSON.stringify(err)}`);
        } else {
          resolve(JSON.stringify(data, null, 2));
        }
      });
    });
  }, "getUserInfo"),
  {
    name: "getUserInfo",
    description: "Get detailed information about one or more users (names, profile pictures) using their user IDs.",
    schema: z.object({
      userIDs: z.array(z.string()).describe("List of user IDs to look up"),
    }),
  }
);

/**
 * Tool to react to a message with an emoji.
 */
export const reactToMessageTool = tool(
  withToolMiddleware(async ({ reaction, messageID }: { reaction: string, messageID?: string }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";

    const targetID = messageID || event.messageID;

    return new Promise((resolve) => {
      api.setMessageReaction(reaction, targetID, (err: any) => {
        if (err) {
          resolve(`Failed to react: ${JSON.stringify(err)}`);
        } else {
          resolve(`Successfully reacted with ${reaction} to message ${targetID}`);
        }
      });
    });
  }, "reactToMessage"),
  {
    name: "reactToMessage",
    description: "React to a message with an emoji sticker.",
    schema: z.object({
      reaction: z.string().describe("The emoji to react with (e.g., '👍', '❤️', '😂')"),
      messageID: z.string().optional().describe("Optional message ID. Defaults to the current user message."),
    }),
  }
);

/**
 * Tool to send a message that mentions specific users.
 */
export const mentionTool = tool(
  withToolMiddleware(async ({ text, mentions }: { text: string, mentions: any[] }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";
    
    const formattedMentions = mentions.map((m: any) => ({
        id: m.uid,
        tag: m.tag
    }));

    return new Promise((resolve) => {
      api.sendMessage({ body: text, mentions: formattedMentions }, event.threadID, (err: any) => {
        if (err) resolve(`Failed to send mention: ${JSON.stringify(err)}`);
        else resolve("Mention sent successfully.");
      }, event.messageID);
    });
  }, "mention"),
  {
    name: "mention",
    description: "Send a message that mentions specific users.",
    schema: z.object({
      text: z.string().describe("The message text containing tags"),
      mentions: z.array(z.object({
        uid: z.string().describe("The user ID to mention"),
        tag: z.string().describe("The tag text to associate with the mention"),
      })).describe("List of users to mention"),
    }),
  }
);
