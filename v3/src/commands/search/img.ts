import axios from "axios";
import { sendImageFromURL } from "../../core/MediaHelper";

export const config = {
    name: "img",
    aliases: ["image", "pic"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Search and get a random image for any keyword",
    commandCategory: "search",
    usages: "[keyword]",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ api, event, message, args }: any) {
    const query = args.join(" ").trim();
    if (!query) return message.reply("❓ Usage: !img [keyword]");

    await message.reaction("⏳");
    try {
        // Use Unsplash Source for random photos by keyword (no API key needed)
        const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
        
        // Resolve the redirect to get the actual image URL
        const res = await axios.get(url, { maxRedirects: 5, responseType: "arraybuffer" });
        const finalUrl = res.request?.res?.responseUrl || url;
        
        await sendImageFromURL(api, event, finalUrl, `🖼️ ${query}`);
        await message.reaction("✅");
    } catch {
        await message.reaction("❌");
        message.reply(`❌ Couldn't find an image for "${query}".`);
    }
}
