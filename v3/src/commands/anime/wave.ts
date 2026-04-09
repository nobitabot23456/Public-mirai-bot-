import { fetchNekosBest, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "wave",
    aliases: ["greet"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Wave at someone with an anime GIF",
    commandCategory: "anime",
    usages: "[@mention]",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const { url, animeTitle } = await fetchNekosBest("wave");
        const mentions = Object.values(event.mentions || {});
        const target = mentions.length > 0 ? ` ${mentions[0]}` : "";
        const caption = `👋 *waves${target}*${animeTitle ? `\n📺 ${animeTitle}` : ""}`;
        await sendImageFromURL(api, event, url, caption);
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to fetch wave GIF.");
    }
}
