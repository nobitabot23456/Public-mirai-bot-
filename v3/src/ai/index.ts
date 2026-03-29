import { HumanMessage } from "@langchain/core/messages";
import { app } from "./graph";

/**
 * Invoke the LangGraph agent
 * @param {string} input - The user message
 * @param {string} threadId - Unique ID for the conversation
 * @returns {Promise<{response: string, classification: {intent: string, mood: string}}>}
 */
export async function chat(input: string, threadId: string, api: any, event: any, botConfig: any, commandNames: string[]) {
  const config = { configurable: { thread_id: threadId, api, event, botConfig, commandNames } };
  
  const result = await app.invoke(
    {
      messages: [new HumanMessage(input)],
    },
    config
  );

  const lastMessage = result.messages[result.messages.length - 1];
  
  return {
    response: lastMessage.content as string,
    classification: result.classification || { intent: "text", mood: "neutral" }
  };
}
