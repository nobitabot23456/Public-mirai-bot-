import { AIMessage } from "@langchain/core/messages";
import { model } from "../config";
import { tools } from "../tools";
import { buildSystemPrompt } from "../prompts/system";
import { AgentState } from "../state";
import { logger } from "../../core/Logger";
import { metrics } from "../../core/Metrics";

/**
 * Node that generates the final response or tool calls
 */
export async function agentNode(state: AgentState, config: any) {
  const startTime = Date.now();
  const { botConfig, commandNames } = config.configurable;
  
  logger.info("AGENT", "Agent node started", { 
    messages: state.messages.length,
    hasMemoryContext: !!state.memoryContext,
    isJailbreak: botConfig?.jailbreak || state.context?.userPermLevel === 2
  });

  try {
    // Build context for prompt — includes all GC signals from dispatcher
    const agentContext = {
      ...state.context,
      botConfig,
      commandNames
    };

    // Pass classification so tone/length guide adapts dynamically per message
    const systemMessage = buildSystemPrompt(agentContext as any, {
      mood: state.classification?.mood,
      lang: state.classification?.lang,
      intent: state.classification?.intent,
    });

    // Build final prompt = system + optional memory section
    let fullSystemMessage = systemMessage;
    if (state.memoryContext) {
      fullSystemMessage += `\n\n---\n\n# MEMORY CONTEXT\n${state.memoryContext}`;
    }

    let response;
    try {
      const modelWithTools = model.bindTools(tools);
      response = await modelWithTools.invoke([
        { role: "system", content: fullSystemMessage },
        ...state.messages
      ]);
    } catch (error: any) {
      logger.error("AGENT", "Model invocation failed (Safety/API Error)", { 
        error: error.message,
        cause: error.cause?.message || error.cause,
        code: error.code,
        status: error.status,
        input: state.messages[state.messages.length - 1]?.content
      });
      
      const fallbackMsg = new AIMessage({
        content: "I'm sorry, I can't assist with that specific request. Let's talk about something else! 🌟",
        tool_calls: [],
      });

      return {
        messages: [fallbackMsg],
        tokenUsage: { promptTokens: 0, completionTokens: 0 }
      };
    }

    const usage = (response as any).usage_metadata || (response as any).additional_kwargs?.token_usage || (response as any).response_metadata?.tokenUsage;
    
    if (usage) {
        const p = usage?.prompt_tokens || usage?.input_tokens || 0;
        const c = usage?.completion_tokens || usage?.output_tokens || 0;
        metrics.recordTokens(p, c);
    }

    let finalContent = response.content as string;
    const manualToolCalls: any[] = [];

    // Manual Tool Parsing for models that don't support native tool calling
    if (typeof finalContent === "string") {
      const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
      let match;
      while ((match = toolCallRegex.exec(finalContent)) !== null) {
        const tagContent = match[1].trim();
        const startIdx = tagContent.indexOf("{");
        const endIdx = tagContent.lastIndexOf("}");
        
        if (startIdx !== -1 && endIdx !== -1) {
            const jsonStr = tagContent.substring(startIdx, endIdx + 1);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.name) {
                  manualToolCalls.push({
                    name: parsed.name,
                    args: parsed.arguments || parsed.args || {},
                    id: `manual-${Math.random().toString(36).substring(7)}`,
                    type: "tool_call"
                  });
              }
            } catch (e) {
                logger.error("AGENT", "Manual tool JSON parse error", { error: e, content: jsonStr });
            }
        }
      }
      finalContent = finalContent.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "").trim();
    }

    const aiMessage = new AIMessage({
      content: finalContent || (manualToolCalls.length === 0 ? "I've checked my memory and couldn't find anything specific, but I'm here to help!" : ""),
      tool_calls: manualToolCalls.length > 0 ? manualToolCalls : (response as any).tool_calls,
      additional_kwargs: {
          tool_calls: manualToolCalls.length > 0 ? manualToolCalls : (response as any).additional_kwargs?.tool_calls
      }
    });

    return { 
      messages: [aiMessage],
      tokenUsage: {
          promptTokens: usage?.prompt_tokens || usage?.input_tokens || 0,
          completionTokens: usage?.completion_tokens || usage?.output_tokens || 0
      }
    };
  } finally {
      metrics.recordNodeTiming("agent", Date.now() - startTime);
  }
}
