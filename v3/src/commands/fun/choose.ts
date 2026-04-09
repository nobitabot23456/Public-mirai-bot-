export const config = {
    name: "choose",
    aliases: ["pick", "decide"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Pick randomly from a list of options",
    commandCategory: "fun",
    usages: "[option1] | [option2] | ...",
    cooldowns: 2,
    usePrefix: true,
};

export async function run({ message, event }: any) {
    const raw = event.body.split(/\s+/).slice(1).join(" ");
    const options = raw.split("|").map((s: string) => s.trim()).filter(Boolean);

    if (options.length < 2) {
        return message.reply("❓ Usage: !choose [option1] | [option2] | ...\n\nExample: !choose biryani | pizza | noodles");
    }

    const chosen = options[Math.floor(Math.random() * options.length)];
    message.reply(`🎯 I choose: *${chosen}*`);
}
