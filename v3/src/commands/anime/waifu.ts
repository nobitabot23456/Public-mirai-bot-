import { fetchWaifuPics, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "waifu",
    aliases: ["wf"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random anime waifu image",
    commandCategory: "anime",
    usages: "",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const url = await fetchWaifuPics("waifu");
        await sendImageFromURL(api, event, url, "🌸 Random Waifu~");
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to fetch waifu. Try again!");
    }
}
