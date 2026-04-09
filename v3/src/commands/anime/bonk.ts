import { fetchWaifuPics, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "bonk",
    aliases: [],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Bonk someone with an anime GIF",
    commandCategory: "anime",
    usages: "[@mention]",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const url = await fetchWaifuPics("bonk");
        const mentions = Object.values(event.mentions || {});
        const target = mentions.length > 0 ? ` ${mentions[0]}` : "";
        await sendImageFromURL(api, event, url, `🔨 BONK${target}! go to horny jail 🚔`);
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Bonk failed. The court extends mercy.");
    }
}
