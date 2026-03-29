export const config = {
    name: "prefix",
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Show current prefix",
    commandCategory: "info",
    usages: "",
    cooldowns: 5,
    usePrefix: false
};

export async function run({ api, event, message }: any) {
    const configData = require("../../config.json");
    const currentPrefix = configData.PREFIX;
    return message.reply(`Current prefix is: ${currentPrefix}`);
}
