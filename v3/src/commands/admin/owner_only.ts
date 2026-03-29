export const config = {
    name: "owner_only",
    version: "1.0.0",
    hasPermission: 2,
    credits: "Grandpa Academy",
    description: "Switch RBAC to Owner-Only Mode",
    commandCategory: "admin",
    usages: "",
    cooldowns: 5,
    usePrefix: true
};

export async function run({ message, config, saveConfig }: any) {
    config.rbacMode = 2;
    config.rbac = true;
    saveConfig();

    return message.reply("⛔ Bot is now in **Owner-Only** mode. Only the Owner can use commands.");
}
