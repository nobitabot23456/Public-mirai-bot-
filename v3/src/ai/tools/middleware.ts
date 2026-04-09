// src/ai/tools/middleware.ts

import { logger } from "../../core/Logger";

/**
 * Wraps a tool function with standardized logging and error isolation.
 * Ensures that a tool failure doesn't crash the entire agent reasoning loop.
 * 
 * @param toolFn The tool function to wrap
 * @param toolName The name of the tool for logging purposes
 */
export function withToolMiddleware(toolFn: Function, toolName: string) {
  return async (...args: any[]) => {
    const start = Date.now();
    logger.info("TOOL:START", `Executing ${toolName}`, { args: args[0] });
    
    try {
      // Execute the tool function with provided arguments
      const result = await toolFn(...args);
      
      const duration = Date.now() - start;
      logger.info("TOOL:DONE", `Successfully executed ${toolName}`, { duration: `${duration}ms` });
      
      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      logger.error("TOOL:FAIL", `Error executing ${toolName}`, { 
        duration: `${duration}ms`, 
        error: err.message,
        stack: err.stack 
      });
      
      // Return a graceful error message to the LLM instead of throwing
      return `Error executing tool "${toolName}": ${err.message}. Please try a different approach or inform the user.`;
    }
  };
}

/**
 * Optional timeout wrapper for tools to prevent hanging operations.
 */
export function withToolTimeout(toolFn: Function, timeoutMs: number = 15000) {
  return async (...args: any[]) => {
    return Promise.race([
      toolFn(...args),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Tool operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };
}
