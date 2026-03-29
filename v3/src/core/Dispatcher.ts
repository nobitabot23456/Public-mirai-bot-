import fs from "fs-extra";
import path from "path";
import { messageHandler } from "../../handlers/messageHandler";
import { getConfig, saveConfig } from "./Config";
import { getPermissionLevel } from "./RBAC";
import { commands, aliases } from "./Loader";
import { db } from "./Database";
import { Command } from "./types";

function truncateLine(text: string): string {
    const firstLine = text.split("\n")[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + "..." : firstLine;
}

export async function handleMessage(api: any, event: any) {
    const config = getConfig();
    const message = messageHandler({ api, event });
    const body = (message.body || "").trim();
    
    try {
        await db.saveMessage({
            messageID: event.messageID,
            threadID: event.threadID,
            senderID: event.senderID,
            body: body,
            timestamp: event.timestamp
        });
    } catch (e) {
        console.error("[ DB ] Failed to save message:", e);
    }
    
    if (body) {
        console.log(`[ MSG ] From: ${event.senderID} | Body: "${truncateLine(body)}"`);
        if (config.debug) {
            console.log(`[ DEBUG ] Commands: ${commands.size} | Prefix: "${config.PREFIX}"`);
        }
    }

    let commandMatched = false;
    const permissionLevel = getPermissionLevel(event.senderID);
    const prefix = config.PREFIX || "!";
    
    // Command matching
    let cmdName: string | undefined;
    let isPrefixed = false;

    if (body.startsWith(prefix)) {
        cmdName = body.slice(prefix.length).trim().split(/\s+/)[0]?.toLowerCase();
        isPrefixed = true;
    } else {
        cmdName = body.split(/\s+/)[0]?.toLowerCase();
        isPrefixed = false;
    }

    if (cmdName) {
        // Resolve alias to primary name
        const primaryName = aliases.get(cmdName) || cmdName;
        const command = commands.get(primaryName);

        if (command) {
            const hasPermission = command.config.hasPermission || 0;
            const usePrefix = command.config.usePrefix !== false; // Default to true

            // Match if: (prefixed and cmd uses prefix) OR (not prefixed and cmd doesn't use prefix)
            if ((isPrefixed && usePrefix) || (!isPrefixed && !usePrefix)) {
                commandMatched = true;
                console.log(`[ MATCH ] Command: ${primaryName} (lvl ${permissionLevel} vs ${hasPermission})`);

                // RBAC Check
                if (config.rbac) {
                    const rbacMode = config.rbacMode || 0;
                    if (rbacMode === 2 && permissionLevel < 2) {
                        return message.reply(`⛔ Bot is currently in **Owner-Only** mode. Access denied.`);
                    }
                    if (rbacMode === 1 && permissionLevel < 1) {
                        return message.reply(`🚫 Bot is currently in **Admin-Only** mode. Access denied.`);
                    }
                    if (permissionLevel < hasPermission) {
                        return message.reply(`❌ You don't have permission to use "${primaryName}". Requires level ${hasPermission}.`);
                    }
                }

                try {
                    const args = body.trim().split(/\s+/).slice(1);
                    await command.run({ api, event, message, config, saveConfig, commands, args });
                } catch (error) {
                    console.error(`[ ERROR ] Command ${primaryName} failed:`, error);
                }
            }
        }
    }

    // AI routing for non-command messages
    if (!commandMatched && message.body && !event.senderID.includes(api.getCurrentUserID())) {
        // Check AI permissions if RBAC is enabled
        if (config.rbac) {
            const rbacMode = config.rbacMode || 0;
            const aiMinRole = config.aiMinRole || 0;

            if (rbacMode === 2 && permissionLevel < 2) return;
            if (rbacMode === 1 && permissionLevel < 1) return;
            if (permissionLevel < aiMinRole) return;
        }

        const aiPath = path.join(__dirname, "..", "ai");
        if (fs.existsSync(aiPath)) {
            try {
                // Fetch last 15 messages for context from Local DB
                const history = await db.getHistory(event.threadID, 15);
                
                const { chat } = require("../ai");
                const { response, classification } = await chat(
                    message.body, 
                    event.threadID, 
                    api, 
                    event, 
                    config, 
                    Array.from(commands.keys()),
                    history
                );

                console.log(`[ AI CLASSIFY ] Intent: ${classification.intent} | Mood: ${classification.mood} | For Bot: ${classification.intent !== 'ignore'}`);
                
                // Final sanitize and check
                const finalReply = response.replace(/\[.*?\]/g, "").trim();

                // Only reply if it's NOT an ignore intent and has actual content
                if (finalReply && classification.intent !== "ignore") {
                    await message.reply(finalReply);
                }
            } catch (error) {
                console.error("AI Error:", error);
            }
        }
    }
}
