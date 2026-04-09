export const config = {
    name: "calc",
    aliases: ["math", "calculate"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Calculate a mathematical expression",
    commandCategory: "utility",
    usages: "[expression]",
    cooldowns: 2,
    usePrefix: true,
};

// Safe math evaluator — no eval()
function safeMath(expr: string): number {
    // Strip everything that isn't math
    const clean = expr.replace(/[^0-9+\-*/.()%^ ]/g, "").trim();
    if (!clean) throw new Error("Invalid expression");
    
    // Use Function constructor (safer than eval, still sandboxed)
    const result = Function(`"use strict"; return (${clean.replace(/\^/g, "**")})`)();
    if (typeof result !== "number" || !isFinite(result)) throw new Error("Result is not a finite number");
    return result;
}

export async function run({ message, args }: any) {
    const expr = args.join(" ").trim();
    if (!expr) return message.reply("❓ Usage: !calc [expression]\nExample: !calc 25 * 4 + 10");

    try {
        const result = safeMath(expr);
        message.reply(`🧮 ${expr} = **${result}**`);
    } catch {
        message.reply("❌ Invalid expression. Example: !calc 25 * 4 + 10");
    }
}
