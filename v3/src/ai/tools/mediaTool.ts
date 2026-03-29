import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const sendMediaTool = tool(
  async ({ url, caption, type }, config) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";
    
    return `Tasked to send ${type} from ${url} with caption "${caption || ""}". (Implementation requires media downloader)`;
  },
  {
    name: "sendMedia",
    description: "Send an image or video with an optional caption.",
    schema: z.object({
      url: z.string().describe("The URL of the media file"),
      caption: z.string().optional().describe("Optional caption for the media"),
      type: z.enum(["image", "video"]).describe("Type of media"),
    }),
  }
);
