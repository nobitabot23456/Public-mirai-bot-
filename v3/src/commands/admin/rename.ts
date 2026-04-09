export const config = {
    name: "rename",
    aliases: ["setname", "groupname"],
    version: "1.0.0",
    hasPermission: 1,
    credits: "Grandpa Academy",
    description: "Rename the current group chat",
    commandCategory: "admin",
    usages: "[new name]",
    cooldowns: 10,
    usePrefix: true,
};

export async function run({ api, event, message, args }: any) {
    if (!event.isGroup) {
        return message.reply("❌ Group chats only.");
    }

    const newName = args.join(" ").trim();
    if (!newName) {
        return message.reply("❓ Usage: !rename [new group name]");
    }

    if (newName.length > 500) {
        return message.reply("❌ Name is too long (max 500 characters).");
    }

    try {
        await new Promise<void>((resolve, reject) => {
            api.setTitle(newName, event.threadID, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
        message.reply(`✅ Group renamed to "${newName}".`);
    } catch (err: any) {
        message.reply(`❌ Failed to rename group. Make sure I'm an admin.\n${err?.error || ""}`);
    }
}
