import { AgentState } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { logger } from "../../core/Logger";
import { metrics } from "../../core/Metrics";

/**
 * Node that validates and cleans the agent's output.
 */
export async function outputGuardrailNode(state: AgentState) {
    const startTime = Date.now();
    
    try {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!(lastMessage instanceof AIMessage)) {
            return {};
        }

        let content = lastMessage.content as string;
        
        // 1. Ensure metadata tags are present if not empty
        if (content && !content.includes("[INTENT:")) {
            const intent = state.classification?.intent || "text";
            const mood = state.classification?.mood || "neutral";
            const lang = state.classification?.lang || "en";
            content = `[INTENT: ${intent}] [MOOD: ${mood}] [LANG: ${lang}]\n${content}`;
            logger.info("GUARDRAIL", "Added missing metadata to output");
        }

        // 2. Prevent empty responses for non-ignore intents
        if (!content && state.classification?.intent !== "ignore") {
            content = "I'm sorry, I couldn't process that request properly.";
            logger.warn("GUARDRAIL", "Empty non-ignore response detected");
        }

        // 3. Truncate excessively long replies
        if (content.length > 2000) {
            content = content.substring(0, 1997) + "...";
            logger.warn("GUARDRAIL", "Output truncated due to length");
        }

        if (content !== lastMessage.content) {
            const newMessages = [...state.messages];
            newMessages[newMessages.length - 1] = new AIMessage({
                ...lastMessage,
                content: content
            });
            return { messages: newMessages };
        }

        return {};
    } finally {
        metrics.recordNodeTiming("output_guardrail", Date.now() - startTime);
    }
}
