export const config = {
    name: "flip",
    aliases: ["coinflip", "coin"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Flip a coin: heads or tails",
    commandCategory: "fun",
    usages: "",
    cooldowns: 2,
    usePrefix: true,
};

export async function run({ message }: any) {
    const result = Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!";
    message.reply(result);
}
