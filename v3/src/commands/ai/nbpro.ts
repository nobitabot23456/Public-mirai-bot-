import axios from "axios";
import { getStreamFromURL } from "../../core/Utils";

export const config = {
    name: "nbpro",
    aliases: [],
    author: "Tawsif~",
    category: "ai",
    cooldowns: 5,
    hasPermission: 0,
    description: "edit & generate images using Nano-banana Pro",
    usages: "<prompt> | reply to image",
    usePrefix: true
};

export async function run({ message, event, args }: any) {
    let prompt = args.join(" ");
    const reply = event.messageReply;

    if ((!reply && !prompt) || (reply && reply.attachments.length === 0 && !prompt)) {
        return message.reply('provide a prompt or reply to an image');
    }

    if (!reply || reply.attachments.length === 0) {
        // GENERATE
        let ratio = prompt?.split("--ar=")[1] || prompt?.split("--ar ")[1] || '1:1';
        await message.reaction("⏳");
        try {
            const gres = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-gen?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`);
            await message.reply({
                body: "✅ | Generated",
                attachment: await getStreamFromURL(gres.data.imageUrl, 'gen.png')
            });
        } catch (e) {
            console.error(e);
            await message.reaction("❌");
        }
    } else {
        // EDIT
        let imgs = reply.attachments.map((a: any) => a.url);
        await message.reaction("⏳");
        try {
            const eres = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-edit?prompt=${encodeURIComponent(prompt)}&urls=${encodeURIComponent(JSON.stringify(imgs))}`);
            await message.reply({
                attachment: await getStreamFromURL(eres.data.imageUrl, 'edit.png'),
                body: "✅ | image Edited"
            });
        } catch (error) {
            console.error(error);
            await message.reaction("❌");
        }
    }
}
