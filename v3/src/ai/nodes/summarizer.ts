// src/ai/nodes/summarizer.ts

import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { model } from "../config";
import { AgentState } from "../state";
import { logger } from "../../core/Logger";
import { metrics } from "../../core/Metrics";

/**
 * Node that summarizes conversation history if it gets too long.
 * This keeps the context window small and efficient.
 */
export async function summarizerNode(state: AgentState) {
    const startTime = Date.now();
    logger.info("SUMMARIZER", "Summarizer node started", { messagesCount: state.messages.length });
    const messages = state.messages;
    
    // Only summarize if history is substantial (e.g., > 15 messages)
    if (messages.length <= 15) {
        return {};
    }

    logger.info("SUMMARIZER", "History threshold reached. Compressing context...", { 
        originalCount: messages.length 
    });

    try {
        // Find the split point (summarize everything except the last 3-5 messages)
        const toSummarize = messages.slice(0, -5);
        const toKeep = messages.slice(-5);

        const summaryPrompt = `
            You are a conversation summarizer. 
            Summarize the following interaction into a concise 1-2 paragraph recap. 
            Focus on:
            1. What has been discussed so far.
            2. Any specific user preferences or entities mentioned.
            3. The current state of the conversation.
            
            Keep the summary factual and objective.
        `;

        const response = await model.invoke([
            { role: "system", content: summaryPrompt },
            ...toSummarize
        ]);

        const summary = response.content as string;
        
        // Count tokens for the summarization call
        const usage = (response as any).usage_metadata;
        if (usage) {
            metrics.recordTokens(usage.input_tokens || 0, usage.output_tokens || 0);
        }

        logger.info("SUMMARIZER", "Context compressed successfully.");

        // Return the new state with the summary as the first message
        return {
            messages: [
                new HumanMessage(`[CONVERSATION SUMMARY: ${summary}]`),
                ...toKeep
            ]
        };
    } catch (error) {
        logger.error("SUMMARIZER", "Summarization failed", { error });
        return {};
    } finally {
        metrics.recordNodeTiming("summarizer", Date.now() - startTime);
    }
}
