export const config = {
    name: "roast",
    aliases: [],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Roast someone (all in good fun!)",
    commandCategory: "fun",
    usages: "[@mention or reply]",
    cooldowns: 5,
    usePrefix: true,
};

const ROASTS = [
    "tumi ekhon porjonto spell check ছাড়া কিছু lekho, sotti ki?",
    "tor logic sunlam. ChatGPT o confused hoise.",
    "vai tor IQ er cheye amar WiFi password er length beshi.",
    "tumi ki porishrom kore ba Google ke baki kajo kore dite?",
    "tor idea ta shoja interesting... main character howa porishrom lagbe.",
    "tumi ekhon AI er sathe argue korso? bold choice.",
    "bhai amar porichoy diyo na, tor behalf e shommandito hote parbo na.",
    "tumi ki amake ignore koro naki tumi shobko ignore koro?",
    "tor roast banaite hobe na — tumi nijeii kore niyeso 😭",
    "eita sunlam, kintu vablam na. apologies.",
    "vai tor plan ta perfect — jodi failure goal hoy.",
    "tumi actually smart — shudhu prove kora hoy ni abhi ok.",
];

export async function run({ message, event }: any) {
    const mentions = Object.values(event.mentions || {}) as string[];
    const replyUser = event.messageReply?.senderID;
    const target = mentions[0] || (replyUser ? `@${replyUser}` : null);

    const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    const msg = target ? `${target} — ${roast}` : roast;
    message.reply(msg);
}
