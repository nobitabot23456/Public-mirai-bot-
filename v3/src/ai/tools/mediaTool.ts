import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getStreamFromURL } from "../../core/Utils";
import { withToolMiddleware } from "./middleware";

export const sendMediaTool = tool(
  withToolMiddleware(async ({ url, caption, type }: { url: string, caption?: string, type: "image" | "video" }, config: any) => {
    const { api, event } = (config as any).configurable;
    if (!api || !event) return "Error: API context not found.";
    
    const extension = type === "image" ? "png" : "mp4";
    const attachment = await getStreamFromURL(url, `file.${extension}`);
    
    return new Promise((resolve) => {
      api.sendMessage(
        { body: caption || "", attachment },
        event.threadID,
        (err: any, info: any) => {
          if (err) {
            resolve(`Failed to send ${type}: ${JSON.stringify(err)}`);
          } else {
            resolve(`Successfully sent ${type}. ID: ${info.messageID}`);
          }
        },
        event.isGroup ? event.messageID : null
      );
    });
  }, "sendMedia"),
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
