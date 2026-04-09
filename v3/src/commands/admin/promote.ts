export const config = {
    name: "promote",
    aliases: ["makeadmin"],
    version: "1.0.0",
    hasPermission: 2,
    credits: "Grandpa Academy",
    description: "Promote a user to group admin (reply or @mention)",
    commandCategory: "admin",
    usages: "[@mention or reply]",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    if (!event.isGroup) {
        return message.reply("❌ Group chats only.");
    }

    let targetID: string | null = null;

    if (event.messageReply) targetID = event.messageReply.senderID;
    if (!targetID) {
        const ids = Object.keys(event.mentions || {});
        if (ids.length > 0) targetID = ids[0];
    }

    if (!targetID) {
        return message.reply("❓ Reply to a message or @mention the user to promote.");
    }

    try {
        await new Promise<void>((resolve, reject) => {
            api.changeAdminStatus(event.threadID, targetID, true, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
        message.reply(`👑 User ${targetID} has been promoted to admin.`);
    } catch (err: any) {
        message.reply(`❌ Failed to promote. Make sure I'm a group admin.\n${err?.error || ""}`);
    }
}
