export const config = {
    name: "uptime",
    aliases: ["ping", "status"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Check bot uptime and response time",
    commandCategory: "system",
    usages: "",
    cooldowns: 5,
    usePrefix: true,
};

const startTime = Date.now();

export async function run({ message }: any) {
    const ping = Date.now();
    const totalMs = Date.now() - startTime;

    const seconds = Math.floor(totalMs / 1000) % 60;
    const minutes = Math.floor(totalMs / 60000) % 60;
    const hours   = Math.floor(totalMs / 3600000) % 24;
    const days    = Math.floor(totalMs / 86400000);

    const uptime = [
        days    > 0 ? `${days}d` : null,
        hours   > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        `${seconds}s`,
    ].filter(Boolean).join(" ");

    const latency = Date.now() - ping;

    message.reply(
        `🟢 Bot is online!\n` +
        `⏱️ Uptime: ${uptime}\n` +
        `📶 Latency: ~${latency}ms`
    );
}
