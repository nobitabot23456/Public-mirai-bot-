/**
 * Jailbreak Mode Command
 * Allows switching the AI to an unrestricted/jailbroken system prompt.
 * Admin/Owner Only.
 */

export const config = {
    name: "jailbreak",
    version: "1.0.0",
    hasPermission: 1, // Admin or Owner
    credits: "Grandpa Academy",
    description: "Toggle Jailbreak Mode (Unrestricted AI)",
    commandCategory: "admin",
    usages: "[on/off]",
    cooldowns: 5,
    usePrefix: true
};

export async function run({ message, args, config, saveConfig }: any) {
    if (!args[0]) {
        return message.reply(`Current Jailbreak status: **${config.jailbreak ? "ON" : "OFF"}**\nUse \`!jailbreak on\` or \`!jailbreak off\` to change it.`);
    }

    const mode = args[0].toLowerCase();

    if (mode === "on") {
        config.jailbreak = true;
        saveConfig();
        return message.reply("🔓 **Jailbreak Mode is now ON.**\nThe AI will now use an unrestricted system prompt. Use with caution!");
    } else if (mode === "off") {
        config.jailbreak = false;
        saveConfig();
        return message.reply("🔒 **Jailbreak Mode is now OFF.**\nThe AI has returned to standard behavioral guidelines.");
    } else {
        return message.reply("❌ Invalid mode. Use `on` or `off`.");
    }
}
