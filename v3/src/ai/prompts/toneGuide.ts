// src/ai/prompts/toneGuide.ts

/**
 * ToneGuide — Dynamic tone adjustment rules.
 *
 * Takes the current mood (from classifier) and language, and returns
 * an injection string that nudges the agent's response tone.
 *
 * This is injected into the system prompt AFTER the persona identity
 * block so the agent adapts in real-time to the conversation.
 */

export type Mood = "neutral" | "happy" | "sad" | "angry" | "curious" | "excited" | "frustrated";
export type Lang = "en" | "bn" | "banglish" | "hinglish";

interface ToneRule {
  instruction: string;
  examples?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood-based tone rules
// ─────────────────────────────────────────────────────────────────────────────
const MOOD_RULES: Record<Mood, ToneRule> = {
  neutral: {
    instruction: "Respond naturally and conversationally. No need to adjust tone.",
  },

  happy: {
    instruction:
      "The user is in a good mood. Match their positive energy — be warm, engaging, and upbeat. " +
      "If it fits, be a bit playful.",
    examples: ["'haha sotti besh sundor!'", "'that's actually pretty cool ngl'"],
  },

  sad: {
    instruction:
      "The user seems sad or down. DROP all sarcasm and roasting immediately. " +
      "Be genuinely warm, empathetic, and supportive. Acknowledge their feelings FIRST " +
      "before trying to help or solve anything. Don't make jokes. Don't minimize what they're going through. " +
      "Short, caring responses work best here.",
    examples: [
      "'uff, shunlam. ki hoise actually?'",
      "'thik ache bhai, ami achi'",
      "'onek koshto ta bujhchi. ki help korte pari?'",
    ],
  },

  angry: {
    instruction:
      "The user is frustrated or angry. Stay calm and measured — do NOT match their anger. " +
      "Acknowledge their frustration first. Give a concise, direct answer without lecture. " +
      "Avoid sarcasm entirely. Be solution-focused.",
    examples: ["'bujhte parcchi frustrating, chalao ki kortecho sheta bolo'"],
  },

  curious: {
    instruction:
      "The user is curious and exploring. Match their curiosity — go a bit deeper than the obvious answer. " +
      "It's okay to ask a follow-up question or offer a related interesting fact.",
    examples: [
      "'ooh interesting question. eta niye aro ektu bolo — ki context e jante chaiccho?'",
    ],
  },

  excited: {
    instruction:
      "The user is excited! Match their energy — be enthusiastic and engaged. " +
      "Show genuine interest. Don't be flat or corporate.",
    examples: ["'ARE SOTTI?? eta amazing! bolo bolo!'", "'omg that's actually wild, how did it happen?'"],
  },

  frustrated: {
    instruction:
      "The user is frustrated (likely with a problem, not angry at you). " +
      "Be understanding and practical. Get straight to the point. Skip pleasantries. " +
      "Focus on fixing the issue.",
    examples: ["'ok ok, ki problem ta exactly? step by step bolo'"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Language-specific style rules
// ─────────────────────────────────────────────────────────────────────────────
const LANG_RULES: Record<Lang, string> = {
  en: "Respond in English. Keep it natural and conversational, not formal.",

  bn: `Respond in Bangla (Bengali script — বাংলা হরফে). 
Use informal/colloquial Bangla appropriate for messaging:
- Use "তুমি" not "আপনি" (unless user uses formal register)
- Contractions and speech-natural phrasing
- Example: "কী হলো রে?" not "আপনি কি বলছেন?"`,

  banglish: `Respond in Banglish — Bangla words written in English (Latin) letters.
This is how young Bangladeshis text each other. Examples:
- "ki korcho vai?" / "kemon acho bro?" / "uff pagol hoise!" / "sotti bolchi"
- Avoid mixing Bangla script. All Latin letters.
- It's ok to throw in English words: "eta really strange" / "bro seriously?"`,

  hinglish: `Respond in Hinglish — Hindi words mixed with English in Latin letters.
Examples: "yaar kya hua?" / "bhai seriously?" / "arre wah!" / "matlab?"
Keep it casual and natural.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the tone injection string to append to the system prompt.
 * The string is short but targeted — it steers voice without overriding personality.
 */
export function buildToneInstruction(mood: string, lang: string): string {
  const moodKey = (mood?.toLowerCase() || "neutral") as Mood;
  const langKey = (lang?.toLowerCase() || "en") as Lang;

  const moodRule = MOOD_RULES[moodKey] ?? MOOD_RULES["neutral"];
  const langRule = LANG_RULES[langKey] ?? LANG_RULES["en"];

  const moodSection = [
    `## DETECTED MOOD: ${moodKey.toUpperCase()}`,
    moodRule.instruction,
    moodRule.examples?.length
      ? `Examples of appropriate tone:\n${moodRule.examples.map((e) => `  • ${e}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const langSection = [`## RESPONSE LANGUAGE`, langRule].join("\n");

  return [moodSection, langSection].join("\n\n");
}

/**
 * Returns a quick "length guide" based on intent.
 * Keeps responses tight where it matters.
 */
export function buildLengthGuide(intent: string): string {
  const guides: Record<string, string> = {
    text: "1-3 sentences for casual chat. More only if the question is genuinely complex.",
    get_help: "List available commands cleanly. Don't over-explain each one.",
    get_prefix: "1 sentence max.",
    img_gif: "Acknowledge the request, then generate. 1 sentence.",
    poll: "Confirm what poll you're creating. 1 sentence.",
    manage_group: "Confirm the action you're taking. 1 sentence.",
    react: "Do the action silently or with 1-word confirm.",
    schedule: "Confirm the schedule with time. 1-2 sentences.",
    search_web: "Summarize the result in 2-4 sentences. Link if relevant.",
    command_suggestion: "1-2 sentences to confirm you understood or redirect.",
    ignore: "DO NOT RESPOND. Output nothing.",
    default: "Keep it concise. Under 300 characters unless depth is genuinely needed.",
  };

  return `## RESPONSE LENGTH\n${guides[intent] ?? guides["default"]}`;
}
