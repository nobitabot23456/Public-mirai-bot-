import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withToolMiddleware } from "./middleware";
import { logger } from "../../core/Logger";

/**
 * Tavily Web Search Tool with Fallback
 */
export const searchTool = tool(
  withToolMiddleware(async ({ query }: { query: string }) => {
    if (!process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY === "your_tavily_api_key_here") {
      logger.warn("SEARCH", "Tavily API Key missing. Skipping web search.");
      return "Web search is currently disabled (API Key missing). Please inform the user or answer from your internal knowledge.";
    }

    const search = new TavilySearch({ maxResults: 3 });
    const results = await search.invoke({ query });
    return results;
  }, "web_search"),
  {
    name: "web_search",
    description: "Search the web for real-time information, news, and current events. Use this when you don't know the answer or need to verify facts.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);
