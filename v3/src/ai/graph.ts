import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Import nodes
import { classificationNode } from "./nodes/classifier";
import { agentNode } from "./nodes/agent";
import { tools } from "./tools";

/**
 * Define a custom state that extends MessagesAnnotation
 */
const StateSpec = Annotation.Root({
  ...MessagesAnnotation.spec,
  classification: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => ({ intent: "text", mood: "neutral" }),
  }),
});

// Tool node
const toolNode = new ToolNode(tools);

// Define condition
function shouldContinue(state: typeof StateSpec.State) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as any;
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "tools";
    }
    return "__end__";
}

// Define and assemble the graph
const workflow = new StateGraph(StateSpec)
  .addNode("classifier", classificationNode)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge("__start__", "classifier")
  .addEdge("classifier", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

// Initialize memory
const checkpointer = new MemorySaver();

// Compile the graph
export const app = workflow.compile({ checkpointer });
