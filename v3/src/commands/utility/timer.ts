export const config = {
    name: "timer",
    aliases: ["countdown", "remind"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Set a countdown timer (max 60 minutes)",
    commandCategory: "utility",
    usages: "[minutes] [label]",
    cooldowns: 10,
    usePrefix: true,
};

const activeTimers = new Map<string, NodeJS.Timeout>();

export async function run({ api, event, message, args }: any) {
    const mins = parseFloat(args[0]);
    const label = args.slice(1).join(" ") || "Timer";

    if (isNaN(mins) || mins <= 0) {
        return message.reply("❓ Usage: !timer [minutes] [label]\nExample: !timer 5 Study break");
    }

    if (mins > 60) {
        return message.reply("❌ Maximum timer is 60 minutes.");
    }

    const key = `${event.senderID}:${event.threadID}`;
    if (activeTimers.has(key)) {
        clearTimeout(activeTimers.get(key)!);
        activeTimers.delete(key);
    }

    const ms = Math.round(mins * 60 * 1000);
    message.reply(`⏱️ Timer set: *${label}* — ${mins} minute${mins === 1 ? "" : "s"}`);

    const t = setTimeout(async () => {
        activeTimers.delete(key);
        api.sendMessage(
            `⏰ Time's up! *${label}* ✅`,
            event.threadID,
            undefined,
            event.isGroup ? event.messageID : null
        );
    }, ms);

    activeTimers.set(key, t);
}
