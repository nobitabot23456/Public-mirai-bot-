import { fetchQuote } from "../../core/MediaHelper";

export const config = {
    name: "quote",
    aliases: ["inspire", "motivation"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random inspirational quote",
    commandCategory: "fun",
    usages: "",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ message }: any) {
    try {
        const { content, author } = await fetchQuote();
        message.reply(`✨ "${content}"\n\n— ${author}`);
    } catch {
        message.reply("❌ Couldn't fetch a quote right now.");
    }
}
