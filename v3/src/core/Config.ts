import fs from "fs-extra";
import path from "path";

const configPath = path.join(process.cwd(), "config.json");
let config = require(configPath);

export function getConfig() {
    return config;
}

export function saveConfig() {
    fs.writeJsonSync(configPath, config, { spaces: 2 });
}

export function updateConfig(newConfig: any) {
    config = { ...config, ...newConfig };
    saveConfig();
}
