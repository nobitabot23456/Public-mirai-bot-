const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const fs = require('fs');
const path = require('path');

let cachedTools = null;

function loadCommandTools(api, event) {
    if (cachedTools) {
        // We reuse the same tool instances, but ensure they use the LATEST api/event in their closures
        // Actually, current implementation of DynamicStructuredTool is creating new closures inside the function.
        // To properly cache, we should only scan once and return the tool definitions.
    }

    const tools = [];
    const commandsDir = path.join(__dirname, '../commands');
    
    const defaultSchema = z.object({
        t: z.string().optional().describe("args")
    });

    const categoriesToIgnore = ['system', 'admin', 'game', 'economy', 'nsfw'];

    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                scanDir(fullPath);
            } else if (file.endsWith('.js')) {
                try {
                    const cmd = require(fullPath);
                    if (cmd.config && cmd.run && cmd.config.hasPermssion === 0 && !categoriesToIgnore.includes(cmd.config.commandCategory?.toLowerCase())) {
                        let desc = (cmd.config.description || cmd.config.name).replace(/\n/g, ' ').substring(0, 50).trim();
                        if (cmd.config.name.toLowerCase() === 'help') desc = "Display command menu.";

                        tools.push(new DynamicStructuredTool({
                            name: cmd.config.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
                            description: desc,
                            schema: defaultSchema,
                            func: async ({ t }) => {
                                const args = t ? t.split(" ") : [];
                                try {
                                    // Use the LATEST api/event passed into loadCommandTools
                                    await cmd.run({ api, event, args });
                                    return "Success.";
                                } catch (e) {
                                    return `Err: ${e.message}`;
                                }
                            }
                        }));
                    }
                } catch (e) {}
            }
        }
    }
    
    scanDir(commandsDir);
    return tools;
}


module.exports = { loadCommandTools };
