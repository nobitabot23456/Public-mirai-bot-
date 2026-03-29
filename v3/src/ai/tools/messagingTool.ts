import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const sendMessageTool = tool(
  async ({ text }, config) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";
    
    return new Promise((resolve) => {
      api.sendMessage(text, event.threadID, (err: any, info: any) => {
        if (err) resolve(`Failed to send message: ${JSON.stringify(err)}`);
        else resolve(`Message sent successfully. ID: ${info.messageID}`);
      }, event.messageID);
    });
  },
  {
    name: "sendMessage",
    description: "Send a plain text message to the current chat.",
    schema: z.object({
      text: z.string().describe("The message text to send"),
    }),
  }
);

export const unsendTool = tool(
  async ({ messageID }, config) => {
    const { api } = (config as any).configurable;
    if (!api) return "Error: API context not found.";
    
    return new Promise((resolve) => {
      api.unsendMessage(messageID, (err: any) => {
        if (err) resolve(`Failed to unsend: ${JSON.stringify(err)}`);
        else resolve("Message unsent successfully.");
      });
    });
  },
  {
    name: "unsend",
    description: "Unsend (delete for everyone) a specific message by its ID.",
    schema: z.object({
      messageID: z.string().describe("The ID of the message to unsend"),
    }),
  }
);

export const editMessageTool = tool(
  async ({ messageID, newText }) => {
    return `Request to edit message ${messageID} to "${newText}". (Feature depends on API support)`;
  },
  {
    name: "editMessage",
    description: "Edit a previously sent message.",
    schema: z.object({
      messageID: z.string().describe("The ID of the message to edit"),
      newText: z.string().describe("The new text content"),
    }),
  }
);
