import { fetchNekosBest, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "hug",
    aliases: [],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Send an anime hug GIF",
    commandCategory: "anime",
    usages: "[@mention]",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const { url, animeTitle } = await fetchNekosBest("hug");
        const mentions = Object.values(event.mentions || {});
        const target = mentions.length > 0 ? ` ${mentions[0]}` : "";
        const caption = `🤗 Sending a hug${target}!${animeTitle ? `\n📺 ${animeTitle}` : ""}`;
        await sendImageFromURL(api, event, url, caption);
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to send hug GIF.");
    }
}
