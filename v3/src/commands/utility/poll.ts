export const config = {
    name: "poll",
    aliases: ["vote"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Create a quick poll in the group",
    commandCategory: "utility",
    usages: "[question] | [option1] | [option2] ...",
    cooldowns: 10,
    usePrefix: true,
};

export async function run({ api, event, message, args }: any) {
    if (!event.isGroup) {
        return message.reply("❌ Polls can only be created in group chats.");
    }

    const raw = event.body.split(/\s+/).slice(1).join(" ");
    const parts = raw.split("|").map((s: string) => s.trim()).filter(Boolean);

    if (parts.length < 3) {
        return message.reply(
            "❓ Usage: !poll [Question] | [Option 1] | [Option 2] ...\n\nExample:\n!poll Best food? | Biryani | Pizza | Noodles"
        );
    }

    const question = parts[0];
    const options = parts.slice(1);

    if (options.length < 2) {
        return message.reply("❓ You need at least 2 options.");
    }

    if (options.length > 10) {
        return message.reply("❌ Maximum 10 options allowed.");
    }

    const optionsObj: Record<string, boolean> = {};
    options.forEach((opt: string) => { optionsObj[opt] = false; });

    try {
        await new Promise<void>((resolve, reject) => {
            api.createPoll(question, event.threadID, optionsObj, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const preview = options.map((o: string, i: number) => `  ${["🅐","🅑","🅒","🅓","🅔","🅕","🅖","🅗","🅘","🅙"][i] || `${i+1}.`} ${o}`).join("\n");
        message.reply(`📊 Poll created!\n\n❓ ${question}\n${preview}`);
    } catch (err: any) {
        message.reply("❌ Failed to create poll.");
    }
}
