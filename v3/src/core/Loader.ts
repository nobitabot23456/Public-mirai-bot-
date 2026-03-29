import fs from "fs-extra";
import path from "path";
import { Command } from "./types";

export const commands = new Map<string, Command>();
export const aliases = new Map<string, string>();

export function loadCommands(dir: string = path.join(process.cwd(), "src", "commands")) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith(".ts") || file.endsWith(".js")) {
            delete require.cache[require.resolve(fullPath)]; // Clear cache for hot-reload
            const command = require(fullPath);
            if (command.config && command.config.name) {
                const cmdName = command.config.name.toLowerCase();
                commands.set(cmdName, command);
                
                // Load aliases
                if (command.config.aliases && Array.isArray(command.config.aliases)) {
                    for (const alias of command.config.aliases) {
                        aliases.set(alias.toLowerCase(), cmdName);
                    }
                }
                
                console.log(`[ LOADED ] Command: ${cmdName} (${(command.config.aliases || []).join(", ")})`);
            }
        }
    }
}
