export const config = {
    name: "nick",
    aliases: ["nickname", "setnick"],
    version: "1.0.0",
    hasPermission: 1,
    credits: "Grandpa Academy",
    description: "Set or clear a member's nickname (reply or @mention)",
    commandCategory: "admin",
    usages: "[@mention or reply] [nickname] (leave empty to clear)",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ api, event, message, args }: any) {
    if (!event.isGroup) {
        return message.reply("❌ Group chats only.");
    }

    let targetID: string | null = null;
    let nicknameArgs = args;

    // From reply
    if (event.messageReply) {
        targetID = event.messageReply.senderID;
    }

    // From mention — strip mention from args
    if (!targetID) {
        const mentionIDs = Object.keys(event.mentions || {});
        if (mentionIDs.length > 0) {
            targetID = mentionIDs[0];
            const mentionTag = event.mentions[targetID];
            nicknameArgs = args.filter((a: string) => !mentionTag.includes(a));
        }
    }

    if (!targetID) {
        return message.reply("❓ Reply to a message or @mention the user to nickname.");
    }

    const nickname = nicknameArgs.join(" ").trim();

    try {
        await new Promise<void>((resolve, reject) => {
            api.changeNickname(nickname, event.threadID, targetID, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (nickname) {
            message.reply(`✏️ Nickname set to "${nickname}" for ${targetID}.`);
        } else {
            message.reply(`🗑️ Nickname cleared for ${targetID}.`);
        }
    } catch (err: any) {
        message.reply(`❌ Failed to set nickname.\n${err?.error || ""}`);
    }
}
