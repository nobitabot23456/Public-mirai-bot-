import { fetchRandomCat, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "catimg",
    aliases: ["randomcat", "meow"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random real cat photo",
    commandCategory: "fun",
    usages: "",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const url = await fetchRandomCat();
        await sendImageFromURL(api, event, url, "🐱 meow~");
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("❌ Failed to fetch cat. The cat ran away 🐈");
    }
}
