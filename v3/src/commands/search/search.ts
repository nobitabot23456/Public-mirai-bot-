import axios from "axios";

export const config = {
    name: "search",
    aliases: ["google", "g"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Search the web using DuckDuckGo",
    commandCategory: "search",
    usages: "[query]",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ message, args }: any) {
    const query = args.join(" ").trim();
    if (!query) return message.reply("❓ Usage: !search [query]");

    try {
        const res = await axios.get(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
        );
        const d = res.data;

        let output = `🔍 *${query}*\n\n`;

        if (d.AbstractText) {
            output += `${d.AbstractText}\n`;
        }

        const topics = (d.RelatedTopics || [])
            .filter((t: any) => t.Text && t.FirstURL)
            .slice(0, 4);

        if (topics.length > 0) {
            output += `\n📌 Related:\n`;
            topics.forEach((t: any, i: number) => {
                output += `${i + 1}. ${t.Text.substring(0, 100)}...\n   🔗 ${t.FirstURL}\n`;
            });
        }

        if (!d.AbstractText && topics.length === 0) {
            output += `No direct results found. Try: https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        }

        message.reply(output);
    } catch {
        message.reply("❌ Search failed. Try again later.");
    }
}
