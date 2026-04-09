export const config = {
    name: "color",
    aliases: ["theme"],
    version: "1.0.0",
    hasPermission: 1,
    credits: "Grandpa Academy",
    description: "Change the group chat color theme",
    commandCategory: "fun",
    usages: "[color name]",
    cooldowns: 10,
    usePrefix: true,
};

const COLORS: Record<string, string> = {
    default:  "196241301102133",
    pink:     "2442142322678320",
    purple:   "2443490819084521",
    green:    "2457013734537557",
    orange:   "175615189761153",
    red:      "2859884484043654",
    blue:     "2058653964378545",
    yellow:   "174636906462322",
    aqua:     "417639218648241",
    teal:     "1928399724138152",
};

const COLOR_EMOJIS: Record<string, string> = {
    default: "⚪", pink: "🌸", purple: "💜", green: "💚",
    orange: "🧡", red: "❤️", blue: "💙", yellow: "💛",
    aqua: "🩵", teal: "🌊",
};

export async function run({ api, event, message, args }: any) {
    if (!event.isGroup) {
        return message.reply("❌ Group chats only.");
    }

    const colorName = (args[0] || "").toLowerCase();

    if (!colorName || colorName === "list") {
        const list = Object.keys(COLORS)
            .map((c) => `${COLOR_EMOJIS[c] || "•"} ${c}`)
            .join("\n");
        return message.reply(`🎨 Available colors:\n${list}\n\nUsage: !color [name]`);
    }

    const themeID = COLORS[colorName];
    if (!themeID) {
        return message.reply(`❓ Unknown color "${colorName}".\nType !color list to see options.`);
    }

    try {
        await new Promise<void>((resolve, reject) => {
            api.changeThreadColor(themeID, event.threadID, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
        message.reply(`${COLOR_EMOJIS[colorName]} Group color changed to ${colorName}!`);
    } catch (err: any) {
        message.reply("❌ Failed to change color. Make sure I'm an admin.");
    }
}
