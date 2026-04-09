export const config = {
    name: "kick",
    aliases: ["remove", "boot"],
    version: "1.0.0",
    hasPermission: 1,
    credits: "Grandpa Academy",
    description: "Remove a user from the group (reply to their message or @mention)",
    commandCategory: "admin",
    usages: "[@mention or reply]",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    if (!event.isGroup) {
        return message.reply("❌ This command only works in group chats.");
    }

    let targetID: string | null = null;

    // From reply
    if (event.messageReply) {
        targetID = event.messageReply.senderID;
    }

    // From mention
    if (!targetID) {
        const mentionIDs = Object.keys(event.mentions || {});
        if (mentionIDs.length > 0) targetID = mentionIDs[0];
    }

    if (!targetID) {
        return message.reply("❓ Reply to a message or @mention the user you want to remove.");
    }

    const botID = api.getCurrentUserID();
    if (targetID === botID) {
        return message.reply("😅 I can't kick myself.");
    }

    try {
        await new Promise<void>((resolve, reject) => {
            api.removeUserFromGroup(targetID, event.threadID, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
        message.reply(`✅ User ${targetID} has been removed from the group.`);
    } catch (err: any) {
        message.reply(`❌ Failed to remove user. Make sure I'm an admin.\n${err?.error || ""}`);
    }
}
