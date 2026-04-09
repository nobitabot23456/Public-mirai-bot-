import { classifierModel } from "../config";
import { buildClassifierPrompt } from "../prompts/classifier";
import { BaseMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { logger } from "../../core/Logger";

import { metrics } from "../../core/Metrics";

/**
 * Node that classifies the user message
 */
export async function classificationNode(state: AgentState, config: any) {
  const startTime = Date.now();
  const { botConfig } = config.configurable;
  const lastMessage = state.messages[state.messages.length - 1] as BaseMessage;

  logger.info("CLASSIFIER", "Classification node started", { 
    isGroup: state.context?.isGroup,
    forceRespond: state.forceRespond 
  });
  
  // Build a rich context object for the classifier prompt
  const classifierCtx = {
    botConfig,
    botName: botConfig?.BOTNAME || "Bela",
    isGroup: state.context?.isGroup ?? false,
    forceRespond: state.forceRespond ?? false,
    ...(state.context || {}),
  };

  const prompt = buildClassifierPrompt(classifierCtx as any, (lastMessage.content as string) || "");

  logger.debug("CLASSIFIER", "Prompting classifier", { 
    isGroup: classifierCtx.isGroup, 
    forceRespond: classifierCtx.forceRespond,
    prompt: prompt.substring(0, 100) + "..."
  });

  try {
    const response = await classifierModel.invoke([
      { role: "system", content: prompt }
    ]);
    
    const usage = (response as any).usage_metadata || (response as any).additional_kwargs?.token_usage || (response as any).response_metadata?.tokenUsage;
    
    if (usage) {
      const p = usage?.prompt_tokens || usage?.input_tokens || 0;
      const c = usage?.completion_tokens || usage?.output_tokens || 0;
      metrics.recordTokens(p, c);
    }

    if (botConfig?.debug) {
      logger.debug("CLASSIFIER", "Raw response", { response: response.content });
    }

    // Extract JSON from response
    const jsonStr = (response.content as string).match(/\{[\s\S]*\}/)?.[0] || '{"intent": "text", "mood": "neutral", "isForBot": true, "confidence": 0.5}';
    const classification = JSON.parse(jsonStr);
    
    // Enforce: if forceRespond is true, override isForBot to true
    if (state.forceRespond) {
      classification.isForBot = true;
      if (classification.intent === "ignore") classification.intent = "text";
    }

    logger.info("CLASSIFIER", "Result", {
      intent: classification.intent,
      isForBot: classification.isForBot,
      confidence: classification.confidence,
      forceOverride: state.forceRespond
    });
    
    return { 
      classification,
      tokenUsage: {
        promptTokens: usage?.prompt_tokens || usage?.input_tokens || 0,
        completionTokens: usage?.completion_tokens || usage?.output_tokens || 0
      }
    };
  } catch (error) {
    logger.error("CLASSIFIER", "Node Error", { error });
    return { classification: { intent: "text", mood: "neutral", lang: "en", confidence: 0, isForBot: state.forceRespond ?? false } };
  } finally {
    metrics.recordNodeTiming("classifier", Date.now() - startTime);
  }
}
