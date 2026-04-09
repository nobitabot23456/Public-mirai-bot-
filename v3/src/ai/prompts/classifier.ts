import { AgentContext } from "../../core/types/agent";

/**
 * Builds the classifier prompt.
 *
 * The classifier's job is ONLY to decide:
 *  - Is this message for the bot?
 *  - What does the user want?
 *  - What's the mood and language?
 *
 * All the heavy reasoning happens in the agent node.
 */
export function buildClassifierPrompt(ctx: AgentContext, input: string): string {
  const botName = ctx?.botConfig?.BOTNAME || ctx?.botName || "Bela";
  const isGroup = ctx?.isGroup ?? false;
  const forceRespond = ctx?.forceRespond ?? false;

  const gcContext = isGroup
    ? `
## GROUP CHAT CONTEXT
- This message was sent in a GROUP chat, NOT a DM.
- In group chats, most messages are between humans and NOT meant for you.
- Only set isForBot=true if the message is clearly and specifically directed at ${botName}.
- If uncertain, ALWAYS default to isForBot=false (ignore) in group chats.

STRONG SIGNALS that the message IS for you (set isForBot=true):
  ✓ The message includes your name: "${botName}"
  ✓ The message uses the bot prefix (e.g., "!")
  ✓ The message is a direct question about what a bot does
  ✓ forceRespond is true (system has pre-detected a hard signal)

STRONG SIGNALS that the message is NOT for you (set isForBot=false):
  ✗ It's casual banter between humans ("lol ok bro", "ki korcho vai")
  ✗ It's reacting to a previous human message
  ✗ It's about personal topics unrelated to bot capabilities
  ✗ It uses 3rd-person language about the bot ("bela ki korte pare?")
  ✗ Low confidence — when in doubt, IGNORE
`
    : `
## PRIVATE CHAT CONTEXT
- This is a DIRECT MESSAGE with a single user. 
- Almost always respond (isForBot=true) unless it's clearly garbage/spam.
`;

  const forceNote = forceRespond
    ? `\n> **OVERRIDE**: The system detected a hard signal (direct reply to bot or DM). Set isForBot=true and intent to "text" unless the message is pure spam.\n`
    : "";

  return `You are a message classification module for an AI chatbot named "${botName}".
Your ONLY job is to classify the incoming message. Do NOT answer the question.
${forceNote}
${gcContext}

## INTENT OPTIONS
Choose the most accurate intent for the message:
- "text"               → General question, conversation, or anything else
- "get_help"           → User wants the command list or asks "what can you do"
- "get_prefix"         → User asks about the bot command prefix
- "img_gif"            → User wants an image or GIF generated
- "poll"               → User wants to create a poll
- "manage_group"       → User wants to rename group, change nickname, or set emoji
- "react"              → User wants the bot to react to a message with an emoji
- "schedule"           → User wants to schedule a reminder or message
- "search_web"         → User explicitly wants a web search or current information
- "command_suggestion" → User describes something a bot command does
- "ignore"             → Message is NOT for the bot (only valid in group chats)

## MOOD OPTIONS
neutral / happy / sad / angry / curious / excited / frustrated

## LANGUAGE OPTIONS
"en" (English) / "bn" (Bangla script) / "banglish" (Bangla in Latin letters) / "hinglish"

## OUTPUT FORMAT
Return ONLY valid JSON. No markdown, no explanation.
{
  "isForBot": boolean,
  "intent": "<one of the intents above>",
  "mood": "<mood>",
  "lang": "<lang>",
  "confidence": <0.0 to 1.0>
}

confidence rules:
- 0.9+ → very clear signal (name mentioned, direct question to bot)
- 0.7-0.9 → likely for bot (relevant topic, question format)
- 0.5-0.7 → borderline (vague, might be for bot)
- < 0.5 → probably NOT for bot; set isForBot=false

---
Message to classify: "${input.replace(/"/g, "'")}"`
}
