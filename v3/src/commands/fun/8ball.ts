export const config = {
    name: "8ball",
    aliases: ["ask", "magic"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Ask the magic 8 ball a yes/no question",
    commandCategory: "fun",
    usages: "[question]",
    cooldowns: 3,
    usePrefix: true,
};

const ANSWERS = [
    // Positive
    "✅ It is certain.",
    "✅ Without a doubt.",
    "✅ Yes, definitely!",
    "✅ You may rely on it.",
    "✅ As I see it, yes.",
    "✅ Most likely.",
    "✅ Outlook good.",
    "✅ Signs point to yes.",
    // Neutral
    "🔮 Reply hazy, try again.",
    "🔮 Ask again later.",
    "🔮 Better not tell you now.",
    "🔮 Cannot predict now.",
    "🔮 Concentrate and ask again.",
    // Negative
    "❌ Don't count on it.",
    "❌ My reply is no.",
    "❌ My sources say no.",
    "❌ Outlook not so good.",
    "❌ Very doubtful.",
];

export async function run({ message, args }: any) {
    const question = args.join(" ").trim();
    if (!question) return message.reply("❓ Usage: !8ball [yes/no question]");

    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    message.reply(`🎱 *${question}*\n\n${answer}`);
}
