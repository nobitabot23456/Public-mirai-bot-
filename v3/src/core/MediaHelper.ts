// src/core/MediaHelper.ts

/**
 * Shared utility for image/media commands.
 * Centralizes URL-fetching, stream creation, and error handling
 * so each command stays minimal.
 */

import axios from "axios";
import { getStreamFromURL } from "./Utils";

export interface MediaResult {
    url: string;
    caption?: string;
    title?: string;
}

/**
 * Fetch a random image from a waifu.pics category.
 * SFW categories: waifu, neko, shinobu, megumin, bully, cuddle, cry,
 *   hug, awoo, kiss, lick, pat, smug, bonk, yeet, blush, smile,
 *   wave, highfive, handhold, nom, bite, glomp, slap, kill, kick,
 *   happy, wink, poke, dance, cringe
 */
export async function fetchWaifuPics(category: string, type: "sfw" | "nsfw" = "sfw"): Promise<string> {
    const res = await axios.get(`https://api.waifu.pics/${type}/${category}`);
    return res.data.url;
}

/**
 * Fetch a random anime GIF from nekos.best.
 * Categories: hug, kiss, pat, slap, wave, baka, blush, cuddle, cry,
 *   dance, facepalm, happy, highfive, laugh, nod, nom, nope, poke,
 *   pout, punch, shrug, sleep, smile, smug, stare, think, thumbsup, wink, yeet
 */
export async function fetchNekosBest(category: string): Promise<{ url: string; animeTitle?: string }> {
    const res = await axios.get(`https://nekos.best/api/v2/${category}`);
    const result = res.data.results?.[0];
    return {
        url: result?.url || "",
        animeTitle: result?.anime_name,
    };
}

/**
 * Fetch from nekos.life for simple image endpoints.
 */
export async function fetchNekosLife(endpoint: string): Promise<string> {
    const res = await axios.get(`https://nekos.life/api/v2/img/${endpoint}`);
    return res.data.url;
}

/**
 * Fetch from waifu.im API (high quality anime images).
 * Tags: waifu, maid, marin-kitagawa, mori-calliope, raiden-shogun, oppai,
 *       selfies, uniform, kamisato-ayaka, milf, oral, paizuri, ecchi, ero
 */
export async function fetchWaifuIm(tags: string[]): Promise<string> {
    const tagQuery = tags.map((t) => `included_tags[]=${encodeURIComponent(t)}`).join("&");
    const res = await axios.get(`https://api.waifu.im/search?${tagQuery}&is_nsfw=false`);
    return res.data.images?.[0]?.url || "";
}

/**
 * Search the web using DuckDuckGo instant answer API.
 * Returns a short description + related topics.
 */
export async function duckDuckGoSearch(query: string): Promise<string> {
    const res = await axios.get(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );
    const d = res.data;
    const abstract = d.AbstractText;
    const related = d.RelatedTopics?.slice(0, 3)
        .map((t: any) => t.Text)
        .filter(Boolean)
        .join("\n• ");

    if (abstract) return abstract;
    if (related) return `• ${related}`;
    return "";
}

/**
 * Fetch Wikipedia summary for a topic.
 */
export async function fetchWikiSummary(query: string): Promise<{ title: string; summary: string; url: string }> {
    const res = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    return {
        title: res.data.title,
        summary: res.data.extract,
        url: res.data.content_urls?.desktop?.page || "",
    };
}

/**
 * Fetch random cat image from The Cat API.
 */
export async function fetchRandomCat(): Promise<string> {
    const res = await axios.get("https://api.thecatapi.com/v1/images/search");
    return res.data[0]?.url || "";
}

/**
 * Fetch random dog image from The Dog API.
 */
export async function fetchRandomDog(): Promise<string> {
    const res = await axios.get("https://dog.ceo/api/breeds/image/random");
    return res.data.message || "";
}

/**
 * Fetch a random anime quote from animechan.
 */
export async function fetchAnimeQuote(): Promise<{ quote: string; character: string; anime: string }> {
    const res = await axios.get("https://animechan.io/api/v1/quotes/random");
    const d = res.data.data;
    return {
        quote: d.content,
        character: d.character?.name || "Unknown",
        anime: d.anime?.name || "Unknown",
    };
}

/**
 * Fetch a random joke from JokeAPI.
 */
export async function fetchJoke(): Promise<string> {
    const res = await axios.get("https://v2.jokeapi.dev/joke/Any?blacklistFlags=racist,sexist&type=single");
    if (res.data.type === "single") return res.data.joke;
    return `${res.data.setup}\n\n${res.data.delivery}`;
}

/**
 * Fetch a random quote from quotable.io.
 */
export async function fetchQuote(): Promise<{ content: string; author: string }> {
    const res = await axios.get("https://api.quotable.io/random");
    return { content: res.data.content, author: res.data.author };
}

/**
 * Helper: send image from URL to FB thread.
 */
export async function sendImageFromURL(
    api: any,
    event: any,
    imageUrl: string,
    caption: string = ""
): Promise<void> {
    const stream = await getStreamFromURL(imageUrl, "img.png");
    await new Promise<void>((resolve, reject) => {
        api.sendMessage(
            { body: caption, attachment: stream },
            event.threadID,
            (err: any) => {
                if (err) reject(err);
                else resolve();
            },
            event.isGroup ? event.messageID : null
        );
    });
}
