import { fetchRandomDog, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "dogimg",
    aliases: ["randomdog", "woof"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random dog photo",
    commandCategory: "fun",
    usages: "",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const url = await fetchRandomDog();
        await sendImageFromURL(api, event, url, "🐶 woof~");
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("❌ Failed to fetch dog photo. The dog is hiding 🐕");
    }
}
