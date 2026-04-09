import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config({ override: true });

/**
 * Initialize the primary model configuration
 */
export const model = new ChatOpenAI({
  configuration: {
    baseURL: process.env.BELA_AI_BASE_URL || "https://openrouter.ai/api/v1",
  },
  modelName: "google/gemini-2.0-flash-lite-001",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY || "NOT_NEEDED",
  timeout: 60000,
});

/**
 * Model specifically for classification (lower temperature)
 */
export const classifierModel = new ChatOpenAI({
  configuration: {
    baseURL: process.env.BELA_AI_BASE_URL || "https://openrouter.ai/api/v1",
  },
  modelName: "google/gemini-2.0-flash-lite-001",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY || "NOT_NEEDED",
  timeout: 60000,
});
