export const config = {
    name: "ship",
    aliases: ["love", "compat"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Check love compatibility between two people or names",
    commandCategory: "fun",
    usages: "[name1] + [name2]",
    cooldowns: 3,
    usePrefix: true,
};

function getLoveScore(a: string, b: string): number {
    // Deterministic but looks random — based on character sum
    const str = [a, b].sort().join("").toLowerCase();
    let hash = 0;
    for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return Math.abs(hash % 101); // 0–100
}

function getLoveBar(score: number): string {
    const filled = Math.round(score / 10);
    return "❤️".repeat(filled) + "🖤".repeat(10 - filled);
}

function getLoveVerdict(score: number): string {
    if (score >= 90) return "💍 soulmates! literally made for each other fr";
    if (score >= 75) return "😍 high compatibility, very promising!";
    if (score >= 60) return "💕 pretty good match tbh";
    if (score >= 45) return "🙂 could work with some effort";
    if (score >= 30) return "😬 ehhh... it's complicated";
    if (score >= 15) return "💔 not looking great ngl";
    return "😭 certified disaster pairing";
}

export async function run({ message, args, event }: any) {
    // Support: !ship Name1 + Name2
    const raw = args.join(" ");
    const parts = raw.split("+").map((s: string) => s.trim()).filter(Boolean);

    // Also support @mentions
    const mentions = Object.values(event.mentions || {}) as string[];
    const names: string[] = [];

    if (mentions.length >= 2) {
        names.push(mentions[0] as string, mentions[1] as string);
    } else if (parts.length >= 2) {
        names.push(parts[0], parts[1]);
    } else {
        return message.reply("❓ Usage: !ship [name1] + [name2]\nOr @mention two people");
    }

    const score = getLoveScore(names[0], names[1]);
    const bar = getLoveBar(score);
    const verdict = getLoveVerdict(score);

    message.reply(
        `💘 *Love Compatibility*\n\n` +
        `${names[0]} × ${names[1]}\n\n` +
        `${bar}\n\n` +
        `Score: *${score}/100*\n` +
        `Verdict: ${verdict}`
    );
}
