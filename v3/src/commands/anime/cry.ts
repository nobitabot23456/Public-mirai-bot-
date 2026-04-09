import { fetchNekosBest, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "cry",
    aliases: ["sob"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Send an anime crying GIF",
    commandCategory: "anime",
    usages: "",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const { url, animeTitle } = await fetchNekosBest("cry");
        const caption = `😢 *cries*${animeTitle ? `\n📺 ${animeTitle}` : ""}`;
        await sendImageFromURL(api, event, url, caption);
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to fetch cry GIF.");
    }
}
