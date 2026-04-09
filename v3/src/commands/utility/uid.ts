export const config = {
    name: "uid",
    aliases: ["id"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get the Facebook User ID of yourself or a tagged user",
    commandCategory: "utility",
    usages: "[@mention or reply]",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    // If replying to a message
    if (event.messageReply) {
        const senderID = event.messageReply.senderID;
        return message.reply(`🆔 User ID: ${senderID}`);
    }

    // If mentioning someone
    const mentionIDs = Object.keys(event.mentions || {});
    if (mentionIDs.length > 0) {
        const lines = mentionIDs.map((id) => `🆔 ${event.mentions[id]}: ${id}`);
        return message.reply(lines.join("\n"));
    }

    // Otherwise return self
    return message.reply(`🆔 Your User ID: ${event.senderID}`);
}
