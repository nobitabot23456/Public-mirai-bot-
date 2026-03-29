import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const mentionTool = tool(
  async ({ text, mentions }, config) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";
    
    const formattedMentions = mentions.map(m => ({
        id: m.uid,
        tag: m.tag
    }));

    return new Promise((resolve) => {
      api.sendMessage({ body: text, mentions: formattedMentions }, event.threadID, (err: any) => {
        if (err) resolve(`Failed to send mention: ${JSON.stringify(err)}`);
        else resolve("Mention sent successfully.");
      }, event.messageID);
    });
  },
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
