import fs from "fs-extra";
import path from "path";
import { messageHandler } from "../../handlers/messageHandler";
import { getConfig, saveConfig } from "./Config";
import { getPermissionLevel } from "./RBAC";
import { commands } from "./Loader";

export async function handleMessage(api: any, event: any) {
    const config = getConfig();
    const message = messageHandler({ api, event });
    const body = (message.body || "").toLowerCase().trim();
    
    console.log(`[ MSG ] From: ${event.senderID} | Body: "${body}"`);

    let commandMatched = false;
    const permissionLevel = getPermissionLevel(event.senderID);

    // Basic command dispatcher
    for (const [name, command] of commands) {
        const hasPermission = command.config.hasPermission || 0;
        
        // Check permission if RBAC is enabled
        if (config.rbac) {
            const rbacMode = config.rbacMode || 0;
            
            // Global Mode Checks
            if (rbacMode === 2 && permissionLevel < 2) {
                // Owner Only Mode
                const isMatch = (body.startsWith(config.PREFIX + name) && command.config.usePrefix) || (body === name && !command.config.usePrefix);
                if (isMatch) {
                    console.log(`[ RBAC ] Owner-Only Mode: User ${event.senderID} denied access to ${name}`);
                    await message.reply(`⛔ Bot is currently in **Owner-Only** mode. Access denied.`);
                    return;
                }
                continue;
            }
            
            if (rbacMode === 1 && permissionLevel < 1) {
                // Admins Only Mode
                const isMatch = (body.startsWith(config.PREFIX + name) && command.config.usePrefix) || (body === name && !command.config.usePrefix);
                if (isMatch) {
                    console.log(`[ RBAC ] Admin-Only Mode: User ${event.senderID} denied access to ${name}`);
                    await message.reply(`🚫 Bot is currently in **Admin-Only** mode. Access denied.`);
                    return;
                }
                continue;
            }

            // Command-specific Permission Check
            if (permissionLevel < hasPermission) {
                const isMatch = (body.startsWith(config.PREFIX + name) && command.config.usePrefix) || (body === name && !command.config.usePrefix);
                if (isMatch) {
                    console.log(`[ RBAC ] User ${event.senderID} denied access to ${name} (lvl ${permissionLevel} < ${hasPermission})`);
                    await message.reply(`❌ You don't have permission to use "${name}". This command requires level ${hasPermission}.`);
                    return;
                }
                continue;
            }
        }

        // Execution Logic
        const isPrefixed = body.startsWith(config.PREFIX + name) && command.config.usePrefix;
        const isNoPrefix = body === name && !command.config.usePrefix;

        if (isPrefixed || isNoPrefix) {
            commandMatched = true;
            try {
                await command.run({ api, event, message, config, saveConfig, commands });
            } catch (error) {
                console.error(`Error running command ${name}:`, error);
            }
        }
    }

    // AI routing for non-command messages
    if (!commandMatched && message.body && !event.senderID.includes(api.getCurrentUserID())) {
        const aiPath = path.join(__dirname, "..", "ai");
        if (fs.existsSync(aiPath)) {
            try {
                const { chat } = require("../ai");
                const { response, classification } = await chat(message.body, event.threadID, api, event);
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
