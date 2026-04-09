import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "../../core/Database";
import { withToolMiddleware } from "./middleware";

/**
 * Tool to search the bot's internal knowledge base (RAG)
 */
export const knowledgeTool = tool(
  withToolMiddleware(async ({ query }: { query: string }) => {
    const results = await db.searchKnowledge(query);
    if (results.length === 0) return "No relevant information found in memory.";
    
    return results.map((r: any, i: number) => `[Fact ${i+1}] ${r.content} (Recorded: ${new Date(r.timestamp).toLocaleString()})`).join("\n");
  }, "search_memory"),
  {
    name: "search_memory",
    description: "Search your long-term memory for facts, rules, or past information. Use this if you don't know the answer to a specific question about the user or your history.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);
