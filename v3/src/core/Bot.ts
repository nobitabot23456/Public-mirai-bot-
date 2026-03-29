import fs from "fs-extra";
import path from "path";
const login = require("../../login");
import { handleMessage } from "./Dispatcher";
import { loadCommands } from "./Loader";

export async function startBot() {
    try {
        const appStatePath = path.join(process.cwd(), "appstate.json");
        if (!fs.existsSync(appStatePath)) {
            throw new Error(`AppState not found at ${appStatePath}`);
        }

        const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));

        // Load commands before starting
        loadCommands();

        login({ appState }, (err: any, api: any) => {
            if (err) {
                console.error("Login Error:", err);
                return;
            }

            console.log(`[ SUCCESS ] Logged in as ${api.getCurrentUserID()}`);
            
            // Initialize Scheduler
            const { scheduler } = require("./Scheduler");
            scheduler.init(api);
            
            api.setOptions({ listenEvents: true, selfListen: false });

            api.listenMqtt(async (err: any, event: any) => {
                if (err) {
                    console.error("Listen Error:", err);
                    return;
                }

                if (event.type === "message" || event.type === "message_reply") {
                    await handleMessage(api, event);
                }
            });
        });
    } catch (error) {
        console.error("Startup Error:", error);
    }
}
