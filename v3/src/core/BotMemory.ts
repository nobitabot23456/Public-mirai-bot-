// src/core/BotMemory.ts

/**
 * BotMemory — Lightweight in-memory tracker for the bot's own messages.
 *
 * Used by the Smart GC decision engine to detect when a user is
 * directly replying to the bot (which should always trigger a response).
 *
 * Also tracks the bot's own userID once set, so the classifier can
 * include it in GC context signals.
 */

class BotMemoryService {
    /** Bot's FB userID — set once after login */
    private botUserID: string | null = null;

    /**
     * Per-thread: stores the bot's last sent message ID.
     * Key:   threadID
     * Value: messageID of the bot's last message in that thread
     */
    private lastBotMessageID = new Map<string, string>();

    /**
     * Per-thread: tracks ALL of the bot's recent message IDs
     * (up to 20 per thread) so we can detect replies to any of them.
     */
    private botMessageHistory = new Map<string, string[]>();

    // ----------------------------------------------------------------
    // Lifecycle
    // ----------------------------------------------------------------

    public setBotUserID(userID: string): void {
        this.botUserID = userID;
    }

    public getBotUserID(): string | null {
        return this.botUserID;
    }

    // ----------------------------------------------------------------
    // Message Tracking
    // ----------------------------------------------------------------

    /** Call this whenever the bot sends a message. */
    public recordBotMessage(threadID: string, messageID: string): void {
        this.lastBotMessageID.set(threadID, messageID);

        const history = this.botMessageHistory.get(threadID) ?? [];
        history.push(messageID);
        // Keep only the last 20 bot message IDs per thread
        if (history.length > 20) history.shift();
        this.botMessageHistory.set(threadID, history);
    }

    /** Returns the messageID of the bot's last sent message in a thread. */
    public getLastBotMessageID(threadID: string): string | null {
        return this.lastBotMessageID.get(threadID) ?? null;
    }

    /**
     * Returns true if the given messageID is one of the bot's
     * recent messages in this thread (i.e., the user is replying to the bot).
     */
    public isBotMessage(threadID: string, messageID: string): boolean {
        const history = this.botMessageHistory.get(threadID) ?? [];
        return history.includes(messageID);
    }

    // ----------------------------------------------------------------
    // GC Decision Signals
    // ----------------------------------------------------------------

    /**
     * Hard-coded "always respond" check — called BEFORE the AI classifier.
     * If this returns true, we skip the classifier throttle entirely.
     *
     * Signals:
     *  1. Not a group chat (DM) → always respond
     *  2. User is replying to one of the bot's messages → always respond
     *  3. Message body mentions the bot by name → always respond (pre-check)
     */
    public shouldAlwaysRespond(params: {
        isGroup: boolean;
        replyToMessageID?: string;
        threadID: string;
        messageBody: string;
        botName: string;
    }): boolean {
        const { isGroup, replyToMessageID, threadID, messageBody, botName } = params;

        // Signal 1: DM
        if (!isGroup) return true;

        // Signal 2: User replied to one of the bot's messages
        if (replyToMessageID && this.isBotMessage(threadID, replyToMessageID)) {
            return true;
        }

        // Signal 3: Rough name mention check (classifier handles the full version)
        if (botName) {
            const lowerBody = messageBody.toLowerCase();
            const lowerName = botName.toLowerCase();
            if (lowerBody.includes(lowerName)) return true;
        }

        return false;
    }
}

export const botMemory = new BotMemoryService();
