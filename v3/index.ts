import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ override: true });

const login = require("./login"); 
import { messageHandler } from "./handlers/messageHandler";
const config = require("./config.json");

const commands = new Map<string, any>();

function getPermissionLevel(senderID: string): number {
    if (config.BOTOWNER?.includes(senderID)) return 2;
    if (config.ADMINBOT?.includes(senderID)) return 1;
    return 0;
}

// Load commands from src/commands/
const commandsPath = path.join(__dirname, "src", "commands");
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.config && command.config.name) {
            commands.set(command.config.name, command);
            console.log(`[ LOADED ] Command: ${command.config.name}`);
        }
    }
}

// Function to handle messages
async function handleMessage(api: any, event: any) {
    const message = messageHandler({ api, event });
    const body = (message.body || "").toLowerCase().trim();
    
    console.log(`[ MSG ] From: ${event.senderID} | Body: "${body}"`);

    let commandMatched = false;

    const permissionLevel = getPermissionLevel(event.senderID);

    // Basic command dispatcher
    for (const [name, command] of commands) {
        const hasPermission = command.config.hasPermission || 0;
        
        // Check permission
        if (permissionLevel < hasPermission) {
            // Only respond if the command was actually called but permission failed
            const isPrefixedMatch = body.startsWith(config.PREFIX + name) && command.config.usePrefix;
            const isNoPrefixMatch = body === name && !command.config.usePrefix;
            
            if (isPrefixedMatch || isNoPrefixMatch) {
                console.log(`[ RBAC ] User ${event.senderID} denied access to ${name} (lvl ${permissionLevel} < ${hasPermission})`);
                await message.reply(`❌ You don't have permission to use "${name}". This command requires level ${hasPermission}.`);
                return;
            }
            continue;
        }

        // Handling noprefix commands
        if (body === name && !command.config.usePrefix) {
            commandMatched = true;
            try {
                await command.run({ api, event, message });
            } catch (error) {
                console.error(`Error running command ${name}:`, error);
            }
        }
        // Handling prefixed commands
        else if (body.startsWith(config.PREFIX + name) && command.config.usePrefix) {
            commandMatched = true;
            try {
                await command.run({ api, event, message });
            } catch (error) {
                console.error(`Error running command ${name}:`, error);
            }
        }
    }

    // AI routing for non-command messages
    if (!commandMatched && message.body && !event.senderID.includes(api.getCurrentUserID())) {
        try {
            const { chat } = require("./src/ai");
            const { response, classification } = await chat(message.body, event.threadID);
            
            console.log(`[ AI CLASSIFY ] Intent: ${classification.intent} | Mood: ${classification.mood}`);
            
            if (response) {
                await message.reply(response);
            }
        } catch (error) {
            console.error("AI Error:", error);
        }
    }
}

// Start the bot
async function startBot() {
    try {
        const appStatePath = path.join(__dirname, "appstate.json");
        if (!fs.existsSync(appStatePath)) {
            throw new Error(`AppState not found at ${appStatePath}`);
        }

        const appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));

        login({ appState }, (err: any, api: any) => {
            if (err) {
                console.error("Login Error:", err);
                return;
            }

            console.log(`[ SUCCESS ] Logged in as ${api.getCurrentUserID()}`);

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

startBot();
