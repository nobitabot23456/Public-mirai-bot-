export const config = {
    name: "admins_only",
    version: "1.0.0",
    hasPermission: 1,
    credits: "Grandpa Academy",
    description: "Switch RBAC to Admin-Only Mode",
    commandCategory: "admin",
    usages: "",
    cooldowns: 5,
    usePrefix: true
};

export async function run({ message, config, saveConfig }: any) {
    config.rbacMode = 1;
    config.rbac = true;
    saveConfig();

    return message.reply("🚫 Bot is now in **Admin-Only** mode. Only Admins and the Owner can use commands.");
}
