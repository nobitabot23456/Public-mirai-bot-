import { fetchNekosBest, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "wink",
    aliases: [],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Send an anime wink GIF",
    commandCategory: "anime",
    usages: "[@mention]",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const { url, animeTitle } = await fetchNekosBest("wink");
        const mentions = Object.values(event.mentions || {});
        const target = mentions.length > 0 ? ` at ${mentions[0]}` : "";
        const caption = `😉 *winks${target}*${animeTitle ? `\n📺 ${animeTitle}` : ""}`;
        await sendImageFromURL(api, event, url, caption);
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to send wink GIF.");
    }
}
