import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './Logger';

const STM_PATH = path.join(__dirname, "../../data/stm.json");
const LTM_PATH = path.join(__dirname, "../../data/ltm.json");
const OLD_DB_PATH = path.join(__dirname, "../../data/db.json");

interface Message {
    messageID: string;
    threadID: string;
    senderID: string;
    senderName?: string;
    body: string;
    timestamp: number;
    replyToID?: string;
    meta?: any;
}

interface Fact {
    id: string;
    content: string;
    source: string;
    /** Optional owning user ID for per-user isolation */
    userID?: string;
    timestamp: number;
}

export interface ScheduledTask {
    id: string;
    threadID: string;
    text: string;
    targetTimestamp: number;
    meta?: any;
}

interface STMData {
    messages: Message[];
    schedules: ScheduledTask[];
}

interface LTMData {
    knowledge: Fact[];
}

class DatabaseService {
    private stm: any;
    private ltm: any;

    private writeTimer: NodeJS.Timeout | null = null;
    private stmDirty: boolean = false;
    private ltmDirty: boolean = false;

    constructor() {
        fs.ensureDirSync(path.dirname(STM_PATH));
    }

    public async init() {
        // Initialize STM (Short Term Memory)
        this.stm = await JSONFilePreset<STMData>(STM_PATH, { messages: [], schedules: [] });
        this.stm.data.messages = this.stm.data.messages || [];
        this.stm.data.schedules = this.stm.data.schedules || [];
        
        // Initialize LTM (Long Term Memory)
        this.ltm = await JSONFilePreset<LTMData>(LTM_PATH, { knowledge: [] });
        this.ltm.data.knowledge = this.ltm.data.knowledge || [];

        // Migration from old db.json if it exists
        if (fs.existsSync(OLD_DB_PATH)) {
            logger.info('DB', 'Found legacy db.json. Migrating to STM/LTM...');
            try {
                const oldData = fs.readJsonSync(OLD_DB_PATH);
                if (oldData.messages) this.stm.data.messages = [...oldData.messages, ...this.stm.data.messages];
                if (oldData.schedules) this.stm.data.schedules = [...oldData.schedules, ...this.stm.data.schedules];
                if (oldData.knowledge) this.ltm.data.knowledge = [...oldData.knowledge, ...this.ltm.data.knowledge];
                
                await this.stm.write();
                await this.ltm.write();
                fs.removeSync(OLD_DB_PATH);
                logger.info('DB', 'Migration complete. Old db.json removed.');
            } catch (e) {
                logger.error('DB', 'Migration failed', { error: e });
            }
        }

        // Start persistence timer (30 seconds)
        this.writeTimer = setInterval(() => this.flush(), 30000);

        logger.info('DB', 'Multi-Storage (STM/LTM) Initialized with 30s debouncing.');
    }

    /**
     * Force write all dirty data to disk immediately.
     */
    public async flush() {
        if (this.stmDirty && this.stm) {
            await this.stm.write();
            this.stmDirty = false;
            logger.debug('DB', 'STM flushed to disk');
        }
        if (this.ltmDirty && this.ltm) {
            await this.ltm.write();
            this.ltmDirty = false;
            logger.debug('DB', 'LTM flushed to disk');
        }
    }

    // --- Message History (STM) ---
    public async saveMessage(msg: Message) {
        if (!this.stm) await this.init();
        if (this.stm.data.messages.some((m: any) => m.messageID === msg.messageID)) return;
        this.stm.data.messages.push(msg);
        // Keep a rolling window of the last 2000 messages
        if (this.stm.data.messages.length > 2000) this.stm.data.messages.shift();
        this.stmDirty = true;
    }

    public async getHistory(threadID: string, limit: number = 20): Promise<Message[]> {
        if (!this.stm) await this.init();
        return this.stm.data.messages
            .filter((m: any) => m.threadID === threadID)
            .slice(-limit);
    }

    // --- Knowledge Base (LTM) ---
    public async addKnowledge(
        content: string,
        source: string = 'user',
        userID?: string
    ) {
        if (!this.ltm) await this.init();
        const fact: Fact = {
            id: Math.random().toString(36).substring(7),
            content,
            source,
            userID,
            timestamp: Date.now()
        };
        this.ltm.data.knowledge.push(fact);
        this.ltmDirty = true;
        return fact;
    }

    public async searchKnowledge(
        query: string,
        limit: number = 5,
        userID?: string
    ): Promise<Fact[]> {
        if (!this.ltm) await this.init();
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        
        const scored = this.ltm.data.knowledge
            .filter((f: any) => {
                // Global facts always included; user-scoped facts only for that user
                if (f.userID && userID && f.userID !== userID) return false;
                const content = f.content.toLowerCase();
                return words.some(word => content.includes(word));
            })
            .map((f: any) => {
                const content = f.content.toLowerCase();
                const score = words.reduce((acc, w) => acc + (content.includes(w) ? 1 : 0), 0);
                return { fact: f, score };
            })
            .sort((a: any, b: any) => b.score - a.score || b.fact.timestamp - a.fact.timestamp)
            .slice(0, limit)
            .map((s: any) => s.fact);
        
        return scored;
    }

    // --- Scheduling (STM) ---
    public async addSchedule(task: ScheduledTask) {
        if (!this.stm) await this.init();
        this.stm.data.schedules.push(task);
        this.stmDirty = true;
    }

    public async getDueSchedules(): Promise<ScheduledTask[]> {
        if (!this.stm) await this.init();
        const now = Date.now();
        return this.stm.data.schedules.filter((s: any) => s.targetTimestamp <= now);
    }

    public async deleteSchedule(id: string) {
        if (!this.stm) await this.init();
        this.stm.data.schedules = this.stm.data.schedules.filter((s: any) => s.id !== id);
        this.stmDirty = true;
    }
}

export const db = new DatabaseService();
