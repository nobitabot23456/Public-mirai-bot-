import { AgentState } from "../state";
import { db } from "../../core/Database";
import { entityStore } from "../../core/EntityStore";
import { logger } from "../../core/Logger";
import { metrics } from "../../core/Metrics";

/**
 * Node that fetches relevant long-term memory facts AND per-user
 * entity data before the agent reasons.  Results are injected into
 * the state as `memoryContext` and prepended to the system prompt
 * by the agent node.
 */
export async function memoryFetchNode(state: AgentState) {
    const startTime = Date.now();
    logger.info("MEMORY", "Memory fetch node started", { 
        hasForceRespond: state.forceRespond,
        hasClassification: !!state.classification 
    });
    const lastMessage = state.messages[state.messages.length - 1];
    const query = lastMessage.content as string;
    const senderID = state.context?.senderID;

    logger.info("MEMORY", "Fetching context", { senderID, query: query.substring(0, 80) });

    try {
        const sections: string[] = [];

        // 1. Per-user entity context (structured attributes)
        if (senderID) {
            const entityCtx = await entityStore.toContextString(senderID).catch(() => "");
            if (entityCtx) sections.push(`### USER PROFILE\n${entityCtx}`);
        }

        // 2. Long-term memory facts (user-scoped + global)
        try {
            const facts = await db.searchKnowledge(query, 5, senderID);
            if (facts.length > 0) {
                const factLines = facts
                    .map((f: any, i: number) => `[Fact ${i + 1}] ${f.content}`)
                    .join("\n");
                sections.push(`### RELEVANT FACTS\n${factLines}`);
            }
        } catch (error) {
            logger.error("MEMORY", "Failed to fetch LTM facts", { error });
        }

        return { memoryContext: sections.join("\n\n") };
    } finally {
        metrics.recordNodeTiming("memory_fetch", Date.now() - startTime);
    }
}

