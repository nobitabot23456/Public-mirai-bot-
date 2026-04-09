import { app } from "./graph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { logger } from "../core/Logger";
import { Intent } from "../core/types/agent";
import { botMemory } from "../core/BotMemory";

/**
 * Invoke the LangGraph agent
 * @param {string} input - The user message
 * @param {string} threadId - Unique ID for the conversation
 */
export async function chat(
  input: string, 
  threadId: string, 
  api: any, 
  event: any, 
  botConfig: any, 
  commandNames: string[], 
  userPermLevel: number = 0,
  history: any[] = []
) {
  const config = { 
    configurable: { 
      thread_id: threadId, 
      api, 
      event, 
      botConfig, 
      commandNames 
    } 
  };
  
  // ── GC Decision Signals ───────────────────────────────────────────
  const botID = botMemory.getBotUserID() || api.getCurrentUserID?.() || "";
  const botName = botConfig?.BOTNAME || "Bela";
  const isGroup = !!event.isGroup;
  const replyToMessageID: string | undefined = event.messageReply?.messageID;

  // Check hard signals (DM, reply-to-bot, name mention) before AI runs
  const forceRespond = botMemory.shouldAlwaysRespond({
    isGroup,
    replyToMessageID,
    threadID: event.threadID,
    messageBody: input,
    botName,
  });

  logger.debug("AI", "Pre-classifier GC decision", { isGroup, forceRespond, replyToMessageID });
  // ─────────────────────────────────────────────────────────────────

  // Convert history to LangChain messages
  const historyMessages = history
    .filter(msg => msg.messageID !== event.messageID)
    .map(msg => {
        const isBot = msg.senderID === botID;
        let content = `[USER: ${msg.senderID}] ${msg.body}`;
        
        if (msg.replyToID) {
            content = `[REPLY TO: ${msg.replyToID}] ${content}`;
        }
        
        return isBot ? new AIMessage(msg.body) : new HumanMessage(content);
    });

  // Prepare initial state — includes GC signals
  const initialState = {
    messages: [...historyMessages, new HumanMessage(`[CURRENT] ${input}`)],
    forceRespond,
    context: {
        threadID: event.threadID,
        senderID: event.senderID,
        isGroup,
        botID,
        botName,
        replyToMessageID,
        forceRespond,
        botConfig,
        commandNames,
        userPermLevel
    }
  };

  logger.info("AI", "Starting graph invocation", { threadId });
  
  let result: any;
  let retries = 1; // Reduced from 3 to 1 to speed up response for failing models
  let delay = 1000;

  for (let i = 0; i <= retries; i++) {
    try {
      result = await app.invoke(initialState, { ...config, recursionLimit: 20 });
      break; 
    } catch (err: any) {
      if (i === retries) {
        logger.error("AI", "Graph invocation failed after retries", { 
            error: err.message,
            stack: err.stack,
            threadId, 
            input: input.substring(0, 100)
        });
        throw err;
      }
      logger.warn("AI", `Attempt ${i + 1} failed. Retrying in ${delay}ms...`, { error: err.message });
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; 
    }
  }

  const lastMessage = result.messages[result.messages.length - 1];
  let content = (lastMessage.content as string) || "";
  let classification = result.classification || { intent: "text", mood: "neutral", lang: "en" };

  // Parse metadata from response if any (AI is instructed to start with it)
  const intentMatch = content.match(/\[INTENT:\s*(.*?)\]/i);
  const moodMatch = content.match(/\[MOOD:\s*(.*?)\]/i);
  const langMatch = content.match(/\[LANG:\s*(.*?)\]/i);

  if (intentMatch) classification.intent = intentMatch[1].toLowerCase() as Intent;
  if (moodMatch) classification.mood = moodMatch[1].toLowerCase();
  if (langMatch) {
      const l = langMatch[1].toLowerCase();
      if (["en", "bn", "banglish", "hinglish"].includes(l)) {
          classification.lang = l as any;
      }
  }

  // Strip all meta-tags and manual tool calls from content
  content = content.replace(/\[(INTENT|MOOD|LANG):\s*.*?\]/gi, "").trim();
  content = content.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "").trim();
  
  // Final safeguard: if content is JUST an ignore tag or similar, or empty
  if (classification.intent === ("ignore" as Intent) || !content) {
      content = "";
  }
  
  return {
    response: content,
    classification
  };
}
