import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "../../core/Database";
import { withToolMiddleware } from "./middleware";

export const saveMemoryTool = tool(
  withToolMiddleware(async ({ content, reason }: { content: string, reason: string }, config: any) => {
    const { event } = (config as any).configurable;
    const source = event ? `User:${event.senderID}` : "system";
    
    const fact = await db.addKnowledge(content, source);
    return `Memory saved successfully: "${content}". Fact ID: ${fact.id}. Reason: ${reason}`;
  }, "save_memory"),
  {
    name: "save_memory",
    description: "Store a new fact, preference, or important detail in your long-term memory. Use this when a user tells you something they want you to remember (e.g., 'I am grandpa', 'My birthday is May 5th').",
    schema: z.object({
      content: z.string().describe("The specific fact or information to remember"),
      reason: z.string().describe("Why is this being saved? (e.g., 'User introduced themselves')"),
    }),
  }
);
