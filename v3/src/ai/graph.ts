import { StateGraph } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Import state and nodes
import { AgentStateAnnotation, AgentState } from "./state";
import { classificationNode } from "./nodes/classifier";
import { agentNode } from "./nodes/agent";
import { inputGuardrailNode } from "./nodes/inputGuardrail";
import { outputGuardrailNode } from "./nodes/outputGuardrail";
import { memoryFetchNode } from "./nodes/memoryFetch";
import { summarizerNode } from "./nodes/summarizer";
import { tools } from "./tools";
import { logger } from "../core/Logger";

// Tool node
const toolNode = new ToolNode(tools);

/**
 * Define condition for routing after agent node
 */
function shouldContinue(state: AgentState) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as any;
    
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        logger.debug("GRAPH", "Routing to tools", { toolCount: lastMessage.tool_calls.length });
        return "tools";
    }
    return "output_guardrail";
}

// GC_CONFIDENCE_THRESHOLD: In group chats, the classifier must meet this
// confidence score for the bot to respond. Lower = more eager. Higher = quieter.
const GC_CONFIDENCE_THRESHOLD = 0.75;

/**
 * shouldRespond — The GC Decision Engine.
 *
 * Tier 1 (ALWAYS RESPOND): forceRespond was set by the dispatcher
 *         (DM, direct reply to bot, or pre-detected name mention).
 *
 * Tier 2 (RESPOND IF CONFIDENT): GC message where the classifier
 *         says isForBot=true AND confidence >= threshold.
 *
 * Tier 3 (IGNORE): Everything else — random GC banter, ambiguous
 *         messages, or below-threshold confidence.
 */
function shouldRespond(state: AgentState) {
  const { classification, forceRespond, context } = state;

  // Tier 1: Hard signal — always respond, skip confidence gating
  if (forceRespond) {
    logger.info("GRAPH", "Tier-1: forceRespond is set — bypassing GC gate");
    return "memory_fetch";
  }

  // Tier 2: Explicit ignore intent
  if (classification?.intent === "ignore") {
    logger.info("GRAPH", "Ignoring — intent=ignore");
    return "__end__";
  }

  // Tier 3: If NOT for bot, drop
  if (!classification?.isForBot) {
    logger.info("GRAPH", "Ignoring — isForBot=false", {
      confidence: classification?.confidence,
      isGroup: context?.isGroup
    });
    return "__end__";
  }

  // Tier 4: In group chats, enforce confidence threshold
  if (context?.isGroup && (classification?.confidence ?? 0) < GC_CONFIDENCE_THRESHOLD) {
    logger.info("GRAPH", "Ignoring GC message — confidence below threshold", {
      confidence: classification?.confidence,
      threshold: GC_CONFIDENCE_THRESHOLD
    });
    return "__end__";
  }

  return "memory_fetch";
}

/**
 * bypassClassifier — Optimization routing.
 * If forceRespond is true (DM, mention, reply, owner), we skip the 
 * slow classifier node and go straight to memory_fetch/agent.
 */
function bypassClassifier(state: AgentState) {
  if (state.forceRespond) {
    logger.info("GRAPH", "forceRespond detected — fast-tracking to memory_fetch (skipping classifier)");
    return "memory_fetch";
  }
  return "classifier";
}

// Define and assemble the graph
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("input_guardrail", inputGuardrailNode)
  .addNode("summarizer", summarizerNode)
  .addNode("classifier", classificationNode)
  .addNode("memory_fetch", memoryFetchNode)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addNode("output_guardrail", outputGuardrailNode)
  
  // Starting flow
  .addEdge("__start__", "input_guardrail")
  .addEdge("input_guardrail", "summarizer")
  
  // Conditional jump: skip classifier if we already have a hard signal
  .addConditionalEdges("summarizer", bypassClassifier, {
    classifier: "classifier",
    memory_fetch: "memory_fetch",
  })
  
  // Routing after classification
  .addConditionalEdges("classifier", shouldRespond, {
    memory_fetch: "memory_fetch",
    __end__: "__end__",
  })
  
  // Memory to Agent
  .addEdge("memory_fetch", "agent")
  
  // Agent loop or end
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    output_guardrail: "output_guardrail",
  })
  
  // Tools back to Agent
  .addEdge("tools", "agent")
  
  // Final edge
  .addEdge("output_guardrail", "__end__");

// Initialize memory (checkpointing for thread persistence)
const checkpointer = new MemorySaver();

// Compile the graph
export const app = workflow.compile({ checkpointer });
