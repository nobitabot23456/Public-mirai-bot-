import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withToolMiddleware } from "./middleware";

/**
 * Tool to fetch bot information (prefix, command list, etc.)
 */
export const getBotInfoTool = tool(
  withToolMiddleware(async (_: any, config: any) => {
    const { botConfig, commandNames } = (config as any).configurable;
    if (!botConfig) return "Error: Bot configuration not found.";
    
    return JSON.stringify({
        name: botConfig.BOTNAME,
        prefix: botConfig.PREFIX,
        commands: commandNames || []
    }, null, 2);
  }, "getBotInfo"),
  {
    name: "getBotInfo",
    description: "Get information about the bot, including its prefix and list of available commands.",
    schema: z.object({}),
  }
);
