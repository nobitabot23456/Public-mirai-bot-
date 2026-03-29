export const config = {
    name: "md",
    aliases: ["details"],
    author: "Grandpa Academy",
    category: "system",
    cooldowns: 2,
    hasPermission: 0,
    description: "View message details",
    usages: "[-all]",
    usePrefix: true
};

export async function run({ message, event, args }: any) {
    const reply = event.messageReply;
    if (!reply) return message.reply("Please reply to a message to see its details.");

    const isAll = args.includes("-all");
    if (isAll) {
        // Truncate if too long for FB
        const fullJson = JSON.stringify(reply, null, 2);
        if (fullJson.length > 3800) {
            return message.reply(`📝 [ FULL DETAILS (TRUNCATED) ]\n\n${fullJson.substring(0, 3800)}...`);
        }
        return message.reply(`📝 [ FULL DETAILS ]\n\n${fullJson}`);
    }

    const time = new Date(Number(reply.timestamp)).toLocaleString();
    let details = `╭─── 〔 MESSAGE DETAILS 〕 ───\n`;
    details += `│ 🆔 ID: ${reply.messageID}\n`;
    details += `│ 👤 Sender: ${reply.senderID}\n`;
    details += `│ 🧵 Thread: ${reply.threadID}\n`;
    details += `│ 🕒 Time: ${time}\n`;
    details += `│ 📝 Body: ${reply.body || "[No Text/Media]"}\n`;
    details += `╰────────────────────────────╯`;

    return message.reply(details);
}
