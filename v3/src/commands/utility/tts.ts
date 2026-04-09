export const config = {
    name: "tts",
    aliases: ["say", "speak"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Convert text to speech audio",
    commandCategory: "utility",
    usages: "[text]",
    cooldowns: 5,
    usePrefix: true,
};

import { getStreamFromURL } from "../../core/Utils";

export async function run({ api, event, message, args }: any) {
    const text = args.join(" ").trim();
    if (!text) return message.reply("❓ Usage: !tts [text]\nExample: !tts Hello everyone!");

    if (text.length > 200) return message.reply("❌ Text too long. Max 200 characters.");

    try {
        // Google TTS — no API key, works for short text
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
        const audioStream = await getStreamFromURL(ttsUrl, "tts.mp3");

        await new Promise<void>((resolve, reject) => {
            api.sendMessage(
                { body: `🔊 "${text}"`, attachment: audioStream },
                event.threadID,
                (err: any) => { if (err) reject(err); else resolve(); },
                event.isGroup ? event.messageID : null
            );
        });
    } catch {
        message.reply("❌ TTS failed. Try again with shorter text.");
    }
}
