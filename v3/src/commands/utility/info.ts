export const config = {
    name: "info",
    aliases: ["groupinfo", "gi"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Show info about the current group chat",
    commandCategory: "utility",
    usages: "",
    cooldowns: 10,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    if (!event.isGroup) {
        return message.reply("ℹ️ This is a private chat.");
    }

    try {
        const data = await new Promise<any>((resolve, reject) => {
            api.getThreadInfo(event.threadID, (err: any, data: any) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const name = data.threadName || data.name || "(No name)";
        const memberCount = data.participantIDs?.length ?? 0;
        const admins = data.adminIDs?.map((a: any) => a.id ?? a) ?? [];
        const emoji = data.emoji || "💬";
        const unread = data.unreadCount ?? 0;

        let info = `╭─── GROUP INFO ───╮\n`;
        info += `📛 Name: ${name}\n`;
        info += `👥 Members: ${memberCount}\n`;
        info += `👑 Admins: ${admins.length}\n`;
        info += `${emoji} Emoji: ${emoji}\n`;
        info += `📩 Unread: ${unread}\n`;
        info += `🔗 Thread ID: ${event.threadID}\n`;

        if (data.inviteLink?.link) {
            info += `🔑 Invite: ${data.inviteLink.link}\n`;
        }

        info += `╰─────────────────╯`;

        message.reply(info);
    } catch (err: any) {
        message.reply("❌ Failed to get group info.");
    }
}
