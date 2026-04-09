import { fetchWaifuPics, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "neko",
    aliases: ["cat", "catgirl"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random neko (cat girl) anime image",
    commandCategory: "anime",
    usages: "",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const url = await fetchWaifuPics("neko");
        await sendImageFromURL(api, event, url, "🐱 Neko~");
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to fetch neko. Try again!");
    }
}
