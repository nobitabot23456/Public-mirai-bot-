import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Tool to fetch bot information (prefix, command list, etc.)
 */
export const getBotInfoTool = tool(
  async (_, config) => {
    const { botConfig, commandNames } = (config as any).configurable;
    if (!botConfig) return "Error: Bot configuration not found.";
    
    if (botConfig.debug) {
        console.log(`[ DEBUG ] Tool: getBotInfo executed.`);
    }

    return JSON.stringify({
        name: botConfig.BOTNAME,
        prefix: botConfig.PREFIX,
        commands: commandNames || []
    }, null, 2);
  },
  {
    name: "getBotInfo",
    description: "Get information about the bot, including its prefix and list of available commands.",
    schema: z.object({}),
  }
);
