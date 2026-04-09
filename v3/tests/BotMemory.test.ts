import { describe, it, expect, beforeEach } from 'vitest';

// We test the BotMemory module directly
// Import the class internals by re-instantiating (singleton reset via module reload)
import { botMemory } from '../src/core/BotMemory';

describe('BotMemory — Smart GC Awareness', () => {

    beforeEach(() => {
        // Reset internal state by re-assigning (testing the singleton's API)
        botMemory.setBotUserID('bot-123');
    });

    // ── getBotUserID ─────────────────────────────────────────────────
    it('should store and return the bot userID', () => {
        expect(botMemory.getBotUserID()).toBe('bot-123');
    });

    // ── recordBotMessage / isBotMessage ──────────────────────────────
    it('should record bot messages and detect them', () => {
        botMemory.recordBotMessage('thread-1', 'msg-abc');
        expect(botMemory.isBotMessage('thread-1', 'msg-abc')).toBe(true);
    });

    it('should not detect messages from other threads', () => {
        botMemory.recordBotMessage('thread-1', 'msg-xyz');
        expect(botMemory.isBotMessage('thread-2', 'msg-xyz')).toBe(false);
    });

    it('should maintain history up to 20 messages per thread', () => {
        for (let i = 0; i < 25; i++) {
            botMemory.recordBotMessage('thread-overflow', `msg-${i}`);
        }
        // The first 5 should be evicted
        expect(botMemory.isBotMessage('thread-overflow', 'msg-0')).toBe(false);
        expect(botMemory.isBotMessage('thread-overflow', 'msg-4')).toBe(false);
        // The last 20 should remain
        expect(botMemory.isBotMessage('thread-overflow', 'msg-5')).toBe(true);
        expect(botMemory.isBotMessage('thread-overflow', 'msg-24')).toBe(true);
    });

    // ── shouldAlwaysRespond — DM ──────────────────────────────────────
    it('should always respond to DMs (isGroup=false)', () => {
        const result = botMemory.shouldAlwaysRespond({
            isGroup: false,
            threadID: 'dm-thread',
            messageBody: 'some message',
            botName: 'Bela',
        });
        expect(result).toBe(true);
    });

    // ── shouldAlwaysRespond — reply to bot ────────────────────────────
    it('should force-respond when user replies to bot message in GC', () => {
        botMemory.recordBotMessage('gc-1', 'bot-sent-msg');
        
        const result = botMemory.shouldAlwaysRespond({
            isGroup: true,
            replyToMessageID: 'bot-sent-msg', // user is replying to bot
            threadID: 'gc-1',
            messageBody: 'ki bolsho?',
            botName: 'Bela',
        });
        expect(result).toBe(true);
    });

    // ── shouldAlwaysRespond — NOT reply to bot ────────────────────────
    it('should NOT force-respond when user replies to a human message', () => {
        botMemory.recordBotMessage('gc-2', 'bot-sent-msg');
        
        const result = botMemory.shouldAlwaysRespond({
            isGroup: true,
            replyToMessageID: 'human-sent-msg', // NOT the bot's message
            threadID: 'gc-2',
            messageBody: 'haha true',
            botName: 'Bela',
        });
        expect(result).toBe(false);
    });

    // ── shouldAlwaysRespond — name mention ────────────────────────────
    it('should force-respond when bot name is mentioned in GC', () => {
        const result = botMemory.shouldAlwaysRespond({
            isGroup: true,
            threadID: 'gc-3',
            messageBody: 'Bela, ki ki korte paro tumi?',
            botName: 'Bela',
        });
        expect(result).toBe(true);
    });

    it('should NOT force-respond for random GC banter with no signals', () => {
        const result = botMemory.shouldAlwaysRespond({
            isGroup: true,
            threadID: 'gc-4',
            messageBody: 'vai kal ki korbi?',
            botName: 'Bela',
        });
        expect(result).toBe(false);
    });
});
