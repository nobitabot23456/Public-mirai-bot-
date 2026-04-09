// src/ai/nodes/inputGuardrail.ts

import { AgentState } from "../state";
import { sanitizeUserInput } from "../prompts/guardrails";
import { HumanMessage } from "@langchain/core/messages";
import { logger } from "../../core/Logger";
import { metrics } from "../../core/Metrics";

/**
 * Node that sanitizes and validates input before it reaches the classifier.
 */
export async function inputGuardrailNode(state: AgentState) {
    const startTime = Date.now();
    
    try {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!(lastMessage instanceof HumanMessage)) {
            return {};
        }

        const content = lastMessage.content as string;
        
        // 1. Sanitize input (anti-injection)
        const sanitizedContent = sanitizeUserInput(content);
        
        // 2. Validate length
        if (sanitizedContent.length > 2000) {
            logger.warn("GUARDRAIL", "Message too long, truncating", { originalLength: content.length });
        }
        
        // 3. Update the last message with sanitized content if it changed
        if (sanitizedContent !== content) {
            logger.info("GUARDRAIL", "Input sanitized", { original: content, sanitized: sanitizedContent });
            const newMessages = [...state.messages];
            newMessages[newMessages.length - 1] = new HumanMessage({
                ...lastMessage,
                content: sanitizedContent
            });
            return { messages: newMessages };
        }

        return {};
    } finally {
        metrics.recordNodeTiming("input_guardrail", Date.now() - startTime);
    }
}
