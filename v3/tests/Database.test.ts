import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../src/core/Database';
import fs from 'fs-extra';
import path from 'path';

describe('DatabaseService', () => {
    beforeEach(async () => {
        // Reset DB before each test by clearing data
        const STM_PATH = path.join(__dirname, '../data/stm.json');
        if (fs.existsSync(STM_PATH)) fs.removeSync(STM_PATH);
        await db.init();
    });

    it('should save and retrieve message history', async () => {
        const msg = {
            messageID: '123',
            threadID: 'thread1',
            senderID: 'user1',
            body: 'Hello',
            timestamp: Date.now()
        };

        await db.saveMessage(msg);
        const history = await db.getHistory('thread1', 5);
        
        expect(history).toHaveLength(1);
        expect(history[0].body).toBe('Hello');
    });

    it('should respect the history limit', async () => {
        for (let i = 0; i < 25; i++) {
            await db.saveMessage({
                messageID: `id-${i}`,
                threadID: 'thread2',
                senderID: 'user1',
                body: `Msg ${i}`,
                timestamp: Date.now()
            });
        }

        const history = await db.getHistory('thread2', 10);
        expect(history).toHaveLength(10);
        expect(history[history.length - 1].body).toBe('Msg 24');
    });

    it('should handle knowledge search with scoring', async () => {
        await db.addKnowledge('Apple is a fruit', 'source1');
        await db.addKnowledge('Banana is yellow', 'source1');
        await db.addKnowledge('Apples are round', 'source1');

        const results = await db.searchKnowledge('apple', 5);
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results[0].content).toContain('Apple');
    });

    it('should support debounced writes and flush', async () => {
        // Mock the lowdb write method
        const writeSpy = vi.spyOn((db as any).stm, 'write');
        
        await db.saveMessage({
            messageID: 'db1',
            threadID: 't1',
            senderID: 'u1',
            body: 'Test',
            timestamp: Date.now()
        });

        // Should NOT have written to disk yet due to debouncing
        expect(writeSpy).not.toHaveBeenCalled();

        // Flush manually
        await db.flush();

        // Should have written to disk now
        expect(writeSpy).toHaveBeenCalledTimes(1);
    });
});
