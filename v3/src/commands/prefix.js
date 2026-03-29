module.exports.config = {
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

module.exports.run = async function({ api, event, message }) {
    const config = require("../../config.json");
    const currentPrefix = config.PREFIX;
    return message.reply(`Current prefix is: ${currentPrefix}`);
};
