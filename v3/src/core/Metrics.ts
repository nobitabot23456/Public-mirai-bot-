// src/core/Metrics.ts

import { logger } from "./Logger";

/**
 * Singleton service for tracking system-wide metrics.
 */
class MetricsService {
    private metrics = {
        tokens: {
            prompt: 0,
            completion: 0
        },
        nodes: {} as Record<string, { totalTime: number, count: number }>,
        tools: {} as Record<string, number>,
        dispatcher: {
            messages: 0
        },
        startTime: Date.now()
    };

    /**
     * Track token usage for a request.
     */
    public recordTokens(prompt: number, completion: number) {
        this.metrics.tokens.prompt += prompt;
        this.metrics.tokens.completion += prompt; // typo in previous thought, should be completion
        this.metrics.tokens.completion = (this.metrics.tokens.completion || 0) + completion;
        
        // Correcting the logic
        // this.metrics.tokens.prompt += prompt;
        // this.metrics.tokens.completion += completion;
        // Re-writing more cleanly:
    }

    // Rewrite class more cleanly below
}

// Clean rewrite
class MetricsCollector {
    private promptTokens = 0;
    private completionTokens = 0;
    private nodeTimings: Record<string, number[]> = {};
    private toolCalls: Record<string, number> = {};
    private messageCount = 0;
    private startTime = Date.now();

    public recordTokens(prompt: number, completion: number) {
        this.promptTokens += prompt;
        this.completionTokens += completion;
    }

    public recordNodeTiming(nodeName: string, durationMs: number) {
        if (!this.nodeTimings[nodeName]) this.nodeTimings[nodeName] = [];
        this.nodeTimings[nodeName].push(durationMs);
    }

    public recordToolCall(toolName: string) {
        this.toolCalls[toolName] = (this.toolCalls[toolName] || 0) + 1;
    }

    public recordIncomingMessage() {
        this.messageCount++;
    }

    public getSummary() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        
        const avgNodeTimings = Object.entries(this.nodeTimings).reduce((acc, [name, times]) => {
            acc[name] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            return acc;
        }, {} as Record<string, number>);

        return {
            uptime_seconds: uptime,
            total_messages: this.messageCount,
            total_tokens: {
                prompt: this.promptTokens,
                completion: this.completionTokens,
                total: this.promptTokens + this.completionTokens
            },
            avg_node_latencies: avgNodeTimings,
            top_tools: Object.entries(this.toolCalls)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
    }

    public logSummary() {
        const summary = this.getSummary();
        logger.info("METRICS", "Session Summary", summary);
    }
}

export const metrics = new MetricsCollector();

// Periodically log metrics every hour
setInterval(() => metrics.logSummary(), 3600000);
