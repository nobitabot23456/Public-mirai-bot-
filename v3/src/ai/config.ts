import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config({ override: true });

/**
 * Initialize the primary model configuration
 */
export const model = new ChatOpenAI({
  configuration: {
    baseURL: process.env.BELA_AI_BASE_URL || "http://localhost:3000/v1",
  },
  modelName: "kilo-auto/free",
  temperature: 0.7,
  openAIApiKey: "NOT_NEEDED",
});

/**
 * Model specifically for classification (lower temperature)
 */
export const classifierModel = new ChatOpenAI({
  configuration: {
    baseURL: process.env.BELA_AI_BASE_URL || "http://localhost:3000/v1",
  },
  modelName: "kilo-auto/free",
  temperature: 0,
  openAIApiKey: "NOT_NEEDED",
});
