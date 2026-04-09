import { fetchWaifuIm, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "maid",
    aliases: [],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random anime maid image",
    commandCategory: "anime",
    usages: "",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const url = await fetchWaifuIm(["maid"]);
        await sendImageFromURL(api, event, url, "🧹 Maid-sama~");
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to fetch maid image.");
    }
}
