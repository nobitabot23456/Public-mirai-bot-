import { classifierModel } from "../config";
import { CLASSIFICATION_PROMPT } from "../prompts";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Node that classifies the user message
 */
export async function classificationNode(state: any, config: any) {
  const { botConfig } = config.configurable;
  const lastMessage = state.messages[state.messages.length - 1] as BaseMessage;
  const prompt = CLASSIFICATION_PROMPT.replace("{input}", (lastMessage.content as string) || "");

  if (botConfig?.debug) {
    console.log(`[ DEBUG ] Classifier Prompt:\n${prompt}`);
  }

  try {
    const response = await classifierModel.invoke([
      ...state.messages.slice(-5), // Send last few messages for context
      { role: "system", content: prompt }
    ]);
    
    if (botConfig?.debug) {
      console.log(`[ DEBUG ] Classifier Raw Response: "${response.content}"`);
      const usage = (response as any).usage_metadata || (response as any).additional_kwargs?.token_usage || (response as any).response_metadata?.tokenUsage;
      if (usage) {
        console.log(`[ BURN ] Classifier: P:${usage.prompt_tokens || usage.input_tokens || 0} | C:${usage.completion_tokens || usage.output_tokens || 0} | T:${usage.total_tokens || (usage.input_tokens + usage.output_tokens) || 0}`);
      }
    }

    // Extract JSON from response
    const jsonStr = (response.content as string).match(/\{.*\}/s)?.[0] || '{"intent": "text", "mood": "neutral"}';
    const classification = JSON.parse(jsonStr);
    
    return { classification };
  } catch (error) {
    console.error("Classification Node Error:", error);
    return { classification: { intent: "text", mood: "error" } };
  }
}
