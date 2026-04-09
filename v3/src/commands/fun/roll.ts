export const config = {
    name: "roll",
    aliases: ["dice", "rng"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Roll dice or get a random number",
    commandCategory: "fun",
    usages: "[max] or [min]-[max]",
    cooldowns: 2,
    usePrefix: true,
};

export async function run({ message, args }: any) {
    let min = 1, max = 6;

    if (args[0]) {
        if (args[0].includes("-")) {
            const parts = args[0].split("-");
            min = parseInt(parts[0]) || 1;
            max = parseInt(parts[1]) || 6;
        } else {
            max = parseInt(args[0]) || 6;
        }
    }

    if (min >= max) return message.reply("❌ Min must be less than max.");
    if (max > 1_000_000) return message.reply("❌ Max is too large.");

    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    message.reply(`🎲 Rolled: **${result}** (${min}–${max})`);
}
