import fs from "fs-extra";
import path from "path";

export const commands = new Map<string, any>();

export function loadCommands(dir: string = path.join(process.cwd(), "v3", "src", "commands")) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith(".ts") || file.endsWith(".js")) {
            const command = require(fullPath);
            if (command.config && command.config.name) {
                commands.set(command.config.name, command);
                console.log(`[ LOADED ] Command: ${command.config.name}`);
            }
        }
    }
}
