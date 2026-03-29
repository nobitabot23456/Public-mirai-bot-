const { updatePersonaState } = require("../ai/personaManager");

module.exports.config = {
    name: "akane",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "GrandpaAcademy",
    description: "Switch Akane's persona modes",
    commandCategory: "ai",
    usages: "[default / neko / assistant / robo]",
    cooldowns: 2,
    usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const mode = (args[0] || "").toLowerCase();

    if (!mode) {
        return api.sendMessage("Usage: ?akane [default / neko / assistant / robo]", threadID, messageID);
    }

    let newState = {};
    let msg = "";

    switch (mode) {
        case "default":
            newState = { neko: false, assistant: false };
            msg = "Akane: Back to basics! I'm just me again. *scratches head* 🍖";
            break;
        case "neko":
            newState = { neko: true, assistant: false };
            msg = "Akane: Nyaa~?! Since when did I have ears? Fine, whatever... where's the fish? *wiggles tail* 🐱🍖";
            break;
        case "assistant":
        case "robo":
            newState = { assistant: true, neko: false };
            msg = "Akane: Ugh, fine. I'll be your 'assistant' or whatever. Just don't expect me to read any boring books! *yawns* 🤖🍖";
            break;
        case "yandere":
            newState = { yandere: true };
            msg = "Akane: Hehe... you want ME to be yours? Always? I'll crush anyone who looks at you! *smiles intensely* 😈🔪🍖";
            break;
        case "normal":
             newState = { yandere: false };
             msg = "Akane: Calm down, I'm not gonna bite... much. *shrugs* 🍖";
             break;
        default:
            return api.sendMessage("Invalid mode! Use: default, neko, assistant, or robo.", threadID, messageID);
    }

    updatePersonaState(newState);
    api.sendMessage(msg, threadID, messageID);
};
