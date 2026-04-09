import { describe, it, expect, beforeEach } from 'vitest';
import { entityStore } from '../src/core/EntityStore';
import fs from 'fs-extra';
import path from 'path';

describe('EntityStore', () => {
    beforeEach(async () => {
        const ENTITIES_PATH = path.join(__dirname, '../data/entities.json');
        if (fs.existsSync(ENTITIES_PATH)) fs.removeSync(ENTITIES_PATH);
        await entityStore.init();
    });

    it('should set and get user attributes', async () => {
        await entityStore.setAttribute('user1', 'name', 'Grandpa');
        await entityStore.setAttribute('user1', 'job', 'Developer');

        const name = await entityStore.getAttribute('user1', 'name');
        expect(name).toBe('Grandpa');

        const job = await entityStore.getAttribute('user1', 'job');
        expect(job).toBe('Developer');
    });

    it('should overwrite existing attributes', async () => {
        await entityStore.setAttribute('user2', 'mood', 'happy');
        await entityStore.setAttribute('user2', 'mood', 'excited');

        const mood = await entityStore.getAttribute('user2', 'mood');
        expect(mood).toBe('excited');
    });

    it('should return context string for prompt injection', async () => {
        await entityStore.setAttribute('user3', 'name', 'Bela');
        await entityStore.setAttribute('user3', 'hobby', 'coding');

        const ctx = await entityStore.toContextString('user3');
        expect(ctx).toContain('Name: Bela');
        expect(ctx).toContain('hobby: coding');
    });
});
