import fs from "fs-extra";
import path from "path";
const login = require("../../login");
import { handleMessage } from "./Dispatcher";
import { loadCommands } from "./Loader";
import { logger } from "./Logger";
import { botMemory } from "./BotMemory";

export async function startBot() {
    try {
        const appStatePath = path.join(process.cwd(), "appstate.json");
        if (!fs.existsSync(appStatePath)) {
            throw new Error(`AppState not found at ${appStatePath}`);
        }

        const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));

        // Load commands before starting
        loadCommands();

        login({ appState }, async (err: any, api: any) => {
            if (err) {
                logger.error("BOT", "Login Error", { error: err });
                return;
            }

            logger.info("BOT", `Logged in as ${api.getCurrentUserID()}`);
            
            // Register bot's own userID in BotMemory for GC reply detection
            botMemory.setBotUserID(api.getCurrentUserID());
            logger.info("BOT", "BotMemory initialized", { botID: api.getCurrentUserID() });
            
            // Initialize Database & Scheduler
            const { db } = require("./Database");
            const { scheduler } = require("./Scheduler");
            
            await db.init();
            scheduler.init(api);
            
            api.setOptions({ listenEvents: true, selfListen: false });

            // --- Graceful Shutdown ---
            const shutdown = async (signal: string) => {
                logger.warn("SYSTEM", `Received ${signal}. Shutting down gracefully...`);
                
                try {
                    // Stop scheduler first
                    if (scheduler && typeof scheduler.stop === 'function') {
                        scheduler.stop();
                    }
                    
                    // Flush DB if needed (debounced writes in Phase 10)
                    if (db && typeof db.flush === 'function') {
                        await db.flush();
                    }
                    
                    logger.info("SYSTEM", "Clean exit. Goodbye!");
                    process.exit(0);
                } catch (e) {
                    logger.error("SYSTEM", "Shutdown error", { error: e });
                    process.exit(1);
                }
            };

            process.on("SIGINT", () => shutdown("SIGINT"));
            process.on("SIGTERM", () => shutdown("SIGTERM"));

            api.listenMqtt(async (err: any, event: any) => {
                if (err) {
                    logger.error("BOT", "Listen Error", { error: err });
                    return;
                }

                if (event.type === "message" || event.type === "message_reply") {
                    await handleMessage(api, event);
                }
            });
        });
    } catch (error) {
        logger.error("BOT", "Startup Error", { error });
    }
}
