export const config = {
    name: "demote",
    aliases: ["removeadmin"],
    version: "1.0.0",
    hasPermission: 2,
    credits: "Grandpa Academy",
    description: "Remove admin status from a group member (reply or @mention)",
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
        return message.reply("❓ Reply to a message or @mention the user to demote.");
    }

    const botID = api.getCurrentUserID();
    if (targetID === botID) {
        return message.reply("😅 I can't demote myself.");
    }

    try {
        await new Promise<void>((resolve, reject) => {
            api.changeAdminStatus(event.threadID, targetID, false, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
        message.reply(`🔽 User ${targetID} has been removed from admin.`);
    } catch (err: any) {
        message.reply(`❌ Failed to demote. Make sure I'm a group admin.\n${err?.error || ""}`);
    }
}
