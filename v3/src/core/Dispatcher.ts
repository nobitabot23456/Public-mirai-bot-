import fs from "fs-extra";
import path from "path";
import { messageHandler } from "../../handlers/messageHandler";
import { getConfig, saveConfig } from "./Config";
import { getPermissionLevel } from "./RBAC";
import { commands } from "./Loader";

function truncateLine(text: string): string {
    const firstLine = text.split("\n")[0];
    if (firstLine.length < text.length || firstLine.length > 50) {
        return firstLine.substring(0, 50) + "...";
    }
    return firstLine;
}

export async function handleMessage(api: any, event: any) {
    const config = getConfig();
    const message = messageHandler({ api, event });
    const body = (message.body || "").trim();
    
    if (body) {
        console.log(`[ MSG ] From: ${event.senderID} | Body: "${truncateLine(body)}"`);
        if (config.debug) {
            console.log(`[ DEBUG ] Commands: ${commands.size} | Prefix: "${config.PREFIX}"`);
        }
    }

    let commandMatched = false;
    const permissionLevel = getPermissionLevel(event.senderID);
    const lowBody = body.toLowerCase();

    // Basic command dispatcher
    for (const [name, command] of commands) {
        const hasPermission = command.config.hasPermission || 0;
        const prefixName = config.PREFIX + name;
        
        const isPrefixed = (lowBody === prefixName || lowBody.startsWith(prefixName + " ")) && command.config.usePrefix;
        const isNoPrefix = (lowBody === name || lowBody.startsWith(name + " ")) && !command.config.usePrefix;

        if (isPrefixed || isNoPrefix) {
            commandMatched = true;
            console.log(`[ MATCH ] Command: ${name} (lvl ${permissionLevel} vs ${hasPermission})`);
            
            // Check permission if RBAC is enabled
            if (config.rbac) {
                const rbacMode = config.rbacMode || 0;
                
                // Global Mode Checks
                if (rbacMode === 2 && permissionLevel < 2) {
                    console.log(`[ RBAC ] Owner-Only Mode denial for ${name}`);
                    await message.reply(`⛔ Bot is currently in **Owner-Only** mode. Access denied.`);
                    return;
                }
                
                if (rbacMode === 1 && permissionLevel < 1) {
                    console.log(`[ RBAC ] Admin-Only Mode denial for ${name}`);
                    await message.reply(`🚫 Bot is currently in **Admin-Only** mode. Access denied.`);
                    return;
                }

                // Command-specific Permission Check
                if (permissionLevel < hasPermission) {
                    console.log(`[ RBAC ] Permission Level denial for ${name}`);
                    await message.reply(`❌ You don't have permission to use "${name}". This command requires level ${hasPermission}.`);
                    return;
                }
            }

            try {
                await command.run({ api, event, message, config, saveConfig, commands });
            } catch (error) {
                console.error(`[ ERROR ] Command ${name} failed:`, error);
            }
            break; // Stop after first match
        }
    }

    // AI routing for non-command messages
    if (!commandMatched && message.body && !event.senderID.includes(api.getCurrentUserID())) {
        const aiPath = path.join(__dirname, "..", "ai");
        if (fs.existsSync(aiPath)) {
            try {
            const { chat } = require("../ai");
            const { response, classification } = await chat(
                message.body, 
                event.threadID, 
                api, 
                event, 
                config, 
                Array.from(commands.keys())
            );
                console.log(`[ AI CLASSIFY ] Intent: ${classification.intent} | Mood: ${classification.mood}`);
                if (response) {
                    await message.reply(response);
                }
            } catch (error) {
                console.error("AI Error:", error);
            }
        }
    }
}
