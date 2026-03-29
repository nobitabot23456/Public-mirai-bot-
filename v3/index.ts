import dotenv from "dotenv";
dotenv.config({ override: true });
import { startBot } from "./src/core/Bot";

// Initialize and start the bot
startBot();
