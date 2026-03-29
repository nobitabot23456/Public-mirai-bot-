import { db } from "../../core/Database";

export const config = {
    name: "addmemory",
    aliases: ["save", "remember"],
    author: "Grandpa Academy",
    category: "ai",
    cooldowns: 5,
    hasPermission: 1, // Admin only by default to avoid spamming the KB
    description: "Add a fact to Anya's long-term memory (RAG)",
    usages: "<fact/info>",
    usePrefix: true
};

export async function run({ message, args, event }: any) {
    const content = args.join(" ");
    if (!content) return message.reply("Please provide some information to remember.");

    try {
        await db.addKnowledge(content, `User:${event.senderID}`);
        message.reaction("✅");
        return message.reply(`Anya has remembered: "${content}"\n\nI can now use this information in future conversations! 🧠✨`);
    } catch (error) {
        console.error(error);
        return message.reply("Failed to save memory. ❌");
    }
}
