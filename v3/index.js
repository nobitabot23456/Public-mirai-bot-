const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();
const login = require("./login");
const messageHandler = require("./handlers/messageHandler");
const config = require("./config.json");

const commands = new Map();

// Load commands from src/commands/
const commandsPath = path.join(__dirname, "src", "commands");
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.config && command.config.name) {
            commands.set(command.config.name, command);
            console.log(`[ LOADED ] Command: ${command.config.name}`);
        }
    }
}

// Function to handle messages
async function handleMessage(api, event) {
    const message = messageHandler({ api, event });
    const body = (message.body || "").toLowerCase().trim();

    let commandMatched = false;

    // Basic command dispatcher
    for (const [name, command] of commands) {
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
            const ai = require("./src/ai/agent");
            const { response, classification } = await ai.chat(message.body, event.threadID);
            
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

        login({ appState }, (err, api) => {
            if (err) {
                console.error("Login Error:", err);
                return;
            }

            console.log(`[ SUCCESS ] Logged in as ${api.getCurrentUserID()}`);

            api.setOptions({ listenEvents: true, selfListen: false });

            api.listenMqtt(async (err, event) => {
                if (err) {
                    console.error("Listen Error:", err);
                    return;
                }

                if (event.type === "message" || event.type === "message_reply") {
                    // const messageInfo = `[ MESSAGE ] From: ${event.senderID} | Body: ${event.body || "(No body)"}`;
                    // console.log(messageInfo);

                    // if (event.attachments && event.attachments.length > 0) {
                    //     event.attachments.forEach((att, i) => {
                    //         console.log(`  - Attachment ${i + 1}: ${att.type} | URL: ${att.url || att.previewUrl || "N/A"}`);
                    //     });
                    // }

                    // if (event.type === "message_reply") {
                    //     console.log(`  - Reply to: ${event.messageReply.messageID} | Body: ${event.messageReply.body}`);
                    // }

                    await handleMessage(api, event);
                }
            });
        });
    } catch (error) {
        console.error("Startup Error:", error);
    }
}

startBot();
