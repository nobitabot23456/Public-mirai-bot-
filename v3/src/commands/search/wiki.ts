import { fetchWikiSummary } from "../../core/MediaHelper";

export const config = {
    name: "wiki",
    aliases: ["wikipedia", "define"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Search Wikipedia for a topic",
    commandCategory: "search",
    usages: "[topic]",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ message, args }: any) {
    const query = args.join(" ").trim();
    if (!query) return message.reply("❓ Usage: !wiki [topic]");

    try {
        const { title, summary, url } = await fetchWikiSummary(query);
        const short = summary.length > 800 ? summary.substring(0, 800) + "..." : summary;
        const msg = `📖 *${title}*\n\n${short}\n\n🔗 ${url}`;
        message.reply(msg);
    } catch {
        message.reply(`❌ No Wikipedia article found for "${args.join(" ")}".`);
    }
}
