import { fetchWaifuPics, sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "smug",
    aliases: [],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Send a smug anime face GIF",
    commandCategory: "anime",
    usages: "",
    cooldowns: 3,
    usePrefix: true,
};

export async function run({ api, event, message }: any) {
    await message.reaction("⏳");
    try {
        const url = await fetchWaifuPics("smug");
        await sendImageFromURL(api, event, url, "😏 heh.");
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply("Failed to fetch smug face. Ironic.");
    }
}
