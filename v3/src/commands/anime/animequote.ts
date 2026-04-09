import { fetchAnimeQuote } from "../../core/MediaHelper";

export const config = {
    name: "animequote",
    aliases: ["aq", "aquote"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random anime quote",
    commandCategory: "anime",
    usages: "",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ message }: any) {
    try {
        const { quote, character, anime } = await fetchAnimeQuote();
        const msg = `💬 "${quote}"\n\n— ${character}\n📺 ${anime}`;
        message.reply(msg);
    } catch {
        message.reply("❌ Couldn't fetch an anime quote right now.");
    }
}
