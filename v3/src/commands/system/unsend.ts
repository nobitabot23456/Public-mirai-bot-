export const config = {
    name: "unsend",
    aliases: ["del", "rm"],
    author: "Grandpa Academy",
    category: "system",
    cooldowns: 2,
    hasPermission: 0,
    description: "Unsend a bot message",
    usages: "",
    usePrefix: true
};

export async function run({ api, message, event }: any) {
    if (!event.messageReply) {
        return message.reply("Please reply to the message you want to unsend.");
    }

    if (event.messageReply.senderID != api.getCurrentUserID()) {
        return message.reply("I can only unsend my own messages.");
    }

    try {
        await api.unsendMessage(event.messageReply.messageID);
    } catch (err) {
        message.reply("Failed to unsend message. It might be too old.");
    }
}
