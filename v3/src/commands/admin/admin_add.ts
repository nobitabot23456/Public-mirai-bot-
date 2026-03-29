export const config = {
    name: "admin_add",
    version: "1.0.0",
    hasPermission: 2,
    credits: "Grandpa Academy",
    description: "Add a user to Admin List",
    commandCategory: "admin",
    usages: "[UID]",
    cooldowns: 5,
    usePrefix: true
};

export async function run({ message, event, config, saveConfig }: any) {
    const args = event.body.split(/\s+/).slice(1);
    const uid = args[0] || (event.messageReply ? event.messageReply.senderID : null);

    if (!uid) return message.reply("⚠️ Please provide a UID or reply to a user's message.");
    
    if (!config.ADMINBOT) config.ADMINBOT = [];
    if (config.ADMINBOT.includes(uid)) return message.reply("ℹ️ This user is already an Admin.");

    config.ADMINBOT.push(uid);
    saveConfig();

    return message.reply(`✅ Added UID ${uid} to Admin List.`);
}
