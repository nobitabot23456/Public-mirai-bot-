export const config = {
    name: "help",
    version: "2.1.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Dynamic & Aesthetic Help Guide",
    commandCategory: "system",
    usages: "[page/command]",
    cooldowns: 5,
    usePrefix: true
};

export async function run({ message, event, config, commands }: any) {
    const args = event.body.split(/\s+/).slice(1);
    const commandArg = (args[0] || "").toLowerCase();

    // ─── COMMAND DETAILS ───
    if (commandArg && commands.has(commandArg)) {
        const command = commands.get(commandArg);
        const { config: cmdConfig } = command;
        
        let info = `╭━━━[ ${cmdConfig.name.toUpperCase()} ]━━━╮\n`;
        info += `📝 Description: ${cmdConfig.description || "No description"}\n`;
        info += `🏷️  Category: ${cmdConfig.commandCategory || "General"}\n`;
        info += `⏱️  Cooldown: ${cmdConfig.cooldowns || 0}s\n`;
        info += `🔒 Permission: Level ${cmdConfig.hasPermission || 0}\n`;
        info += `📖 Usage: ${config.PREFIX}${cmdConfig.name} ${cmdConfig.usages || ""}\n`;
        info += `👤 Credits: ${cmdConfig.credits || "Unknown"}\n`;
        info += `╰━━━━━━━━━━━━━━━━━━╯`;
        return message.reply(info);
    }

    // ─── CATEGORY LISTING (PAGINATED) ───
    const commandList = Array.from(commands.values());
    const categories = Array.from(new Set(commandList.map((cmd: any) => cmd.config.commandCategory || "General")));
    
    const itemsPerPage = 8;
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    let currentPage = 1;

    if (commandArg && !isNaN(parseInt(commandArg))) {
        const parsedPage = parseInt(commandArg);
        if (parsedPage >= 1 && parsedPage <= totalPages) {
            currentPage = parsedPage;
        }
    }

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const visibleCategories = categories.slice(startIdx, endIdx);
    
    const numberFont = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿"];
    const numberFontPage = ["➀","➁","➂","➃","➄","➅","➆","➇","➈","➉"];

    let helpMsg = `╔═══════════════╗\n`;
    helpMsg += `║   🏠 ${config.BOTNAME || "BOT"} HELP GUIDE  ║\n`;
    helpMsg += `╚═══════════════╝\n\n`;

    for (let i = 0; i < visibleCategories.length; i++) {
        const cat = visibleCategories[i];
        const catCmds = commandList
            .filter((cmd: any) => (cmd.config.commandCategory || "General") === cat)
            .map((cmd: any) => cmd.config.name);
        
        helpMsg += `╭─── 〔 ${numberFont[i]} ${cat.toUpperCase()} 〕\n`;
        
        const grid = config.helpGrid || 2;
        for (let j = 0; j < catCmds.length; j += grid) {
            const row = catCmds.slice(j, j + grid);
            const isLastRow = (j + grid) >= catCmds.length;
            
            if (isLastRow) {
                helpMsg += `│ ◗ ✿︎ ${row.join(" ✿︎ ")}\n`;
            } else {
                helpMsg += `│ ◗ ✿︎ ${row.join(" ✿︎ ")}\n`;
            }
        }
        helpMsg += `╰───\n`;
    }

    helpMsg += `╭ ──────── ╮\n`;
    helpMsg += `│ Page ${numberFontPage[currentPage - 1] || currentPage} of ${numberFontPage[totalPages - 1] || totalPages} │\n`;
    helpMsg += `╰ ──────── ╯\n`;
    helpMsg += `◖Total: ${commands.size} commands | ${categories.length} categories◗\n\n`;
    
    helpMsg += `💡 Type "${config.PREFIX}help [name]" for details.\n`;
    helpMsg += `💡 Type "${config.PREFIX}help [page]" for more pages.\n`;
    helpMsg += `👤 Owner: fb.com/${config.ADMINBOT[0] || "Unknown"}`;

    return message.reply(helpMsg);
}
