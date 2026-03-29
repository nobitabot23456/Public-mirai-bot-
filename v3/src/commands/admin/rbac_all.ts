export const config = {
    name: "rbac_all",
    version: "1.0.0",
    hasPermission: 1,
    credits: "Grandpa Academy",
    description: "Switch RBAC to All Mode",
    commandCategory: "admin",
    usages: "",
    cooldowns: 5,
    usePrefix: true
};

export async function run({ message, config, saveConfig }: any) {
    config.rbacMode = 0;
    config.rbac = true;
    saveConfig();

    return message.reply("✅ Bot is now in **All** mode. Anyone can use public commands.");
}
