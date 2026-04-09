import axios from "axios";

export const config = {
    name: "translate",
    aliases: ["tr", "lang"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Translate text to any language",
    commandCategory: "utility",
    usages: "[lang_code] [text] | reply to message",
    cooldowns: 5,
    usePrefix: true,
};

export async function run({ message, event, args }: any) {
    const targetLang = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ") || event.messageReply?.body;

    if (!targetLang || !text) {
        return message.reply(
            "❓ Usage: !tr [lang_code] [text]\n" +
            "Or reply to a message: !tr [lang_code]\n\n" +
            "Examples:\n  !tr en আমি ভালো আছি\n  !tr bn Hello world\n  !tr ja Good morning"
        );
    }

    try {
        // MyMemory free translation API — no key needed
        const res = await axios.get(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`
        );
        const translated = res.data?.responseData?.translatedText;
        const confidence = res.data?.responseData?.match;

        if (!translated || translated === text) {
            return message.reply("❌ Translation failed. Check the language code.");
        }

        message.reply(
            `🌐 *Translated to ${targetLang.toUpperCase()}*:\n${translated}` +
            (confidence < 1 ? `\n\n📊 Confidence: ${Math.round(confidence * 100)}%` : "")
        );
    } catch {
        message.reply("❌ Translation service unavailable. Try again later.");
    }
}
