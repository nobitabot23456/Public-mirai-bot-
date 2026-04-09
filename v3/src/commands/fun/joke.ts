import { fetchJoke } from "../../core/MediaHelper";

export const config = {
    name: "joke",
    aliases: ["lol", "funny"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get a random joke",
    commandCategory: "fun",
    usages: "",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ message }: any) {
    try {
        const joke = await fetchJoke();
        message.reply(`😂 ${joke}`);
    } catch {
        message.reply("❌ Joke machine broke. That's the real joke 😅");
    }
}
