import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { scheduler } from "../../core/Scheduler";
import { withToolMiddleware } from "./middleware";

export const scheduleTool = tool(
  withToolMiddleware(async ({ text, delaySeconds, reason }: { text: string, delaySeconds: number, reason: string }, config: any) => {
    const { event } = (config as any).configurable;
    if (!event) return "Error: Event context not found.";

    const targetTimestamp = Date.now() + (delaySeconds * 1000);
    const id = Math.random().toString(36).substring(7);

    await scheduler.addShortTermTask({
        id,
        threadID: event.threadID,
        text,
        targetTimestamp
    }, delaySeconds * 1000);

    return `Successfully scheduled message: "${text}" in ${delaySeconds} seconds. Reason: ${reason}`;
  }, "scheduleMessage"),
  {
    name: "scheduleMessage",
    description: "Schedule a message to be sent to the current chat after a specific delay (in seconds).",
    schema: z.object({
      text: z.string().describe("The message content to send"),
      delaySeconds: z.number().describe("Delay in seconds from now"),
      reason: z.string().describe("Brief reason for scheduling (e.g., 'Reminding user to study')"),
    }),
  }
);
