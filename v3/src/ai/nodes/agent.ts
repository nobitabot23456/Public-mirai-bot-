import { model } from "../config";
import { tools } from "../tools";
import { AGENT_SYSTEM_PROMPT } from "../prompts";

/**
 * Node that generates the final response or tool calls
 */
export async function agentNode(state: any, config: any) {
  const { botConfig, commandNames } = config.configurable;
  
  const systemMessage = AGENT_SYSTEM_PROMPT
    .replace("{botName}", botConfig?.BOTNAME || "Cyber-Bot")
    .replace("{prefix}", botConfig?.PREFIX || "!")
    .replace("{commands}", (commandNames || []).join(", "));

  if (botConfig?.debug) {
    console.log(`[ DEBUG ] Agent System Prompt:\n${systemMessage}`);
  }

  const modelWithTools = model.bindTools(tools);
  const response = await modelWithTools.invoke([
    { role: "system", content: systemMessage },
    ...state.messages
  ]);

  if (botConfig?.debug) {
    console.log(`[ DEBUG ] Agent Raw Response: "${response.content}"`);
    const usage = (response as any).usage_metadata || (response as any).additional_kwargs?.token_usage || (response as any).response_metadata?.tokenUsage;
    if (usage) {
      console.log(`[ BURN ] Agent: P:${usage.prompt_tokens || usage.input_tokens || 0} | C:${usage.completion_tokens || usage.output_tokens || 0} | T:${usage.total_tokens || (usage.input_tokens + usage.output_tokens) || 0}`);
    }
    if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`[ DEBUG ] Agent calling tools: ${response.tool_calls.map((t: any) => t.name).join(", ")}`);
    }
  }
  
  return { messages: [response] };
}
