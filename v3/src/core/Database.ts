import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs-extra';

const DB_PATH = path.join(__dirname, "../../data/db.json");

interface Message {
    messageID: string;
    threadID: string;
    senderID: string;
    body: string;
    timestamp: number;
}

interface Fact {
    id: string;
    content: string;
    source: string;
    timestamp: number;
}

export interface ScheduledTask {
    id: string;
    threadID: string;
    text: string;
    targetTimestamp: number; // When it should run
    meta?: any;
}

interface Data {
    messages: Message[];
    knowledge: Fact[];
    schedules: ScheduledTask[];
}

class DatabaseService {
    private db: any;

    constructor() {
        fs.ensureDirSync(path.dirname(DB_PATH));
    }

    public async init() {
        const defaultData: Data = { messages: [], knowledge: [], schedules: [] };
        this.db = await JSONFilePreset<Data>(DB_PATH, defaultData);
        console.log("[ DB ] Lowdb (JSON) Connection Established.");
    }

    // --- Message History ---
    public async saveMessage(msg: Message) {
        if (!this.db) await this.init();
        
        // Avoid duplicates
        if (this.db.data.messages.some((m: any) => m.messageID === msg.messageID)) return;
        
        this.db.data.messages.push(msg);
        
        // Keep only last 1000 messages globally to avoid huge JSON
        if (this.db.data.messages.length > 1000) {
            this.db.data.messages.shift();
        }
        
        await this.db.write();
    }

    public async getHistory(threadID: string, limit: number = 20): Promise<Message[]> {
        if (!this.db) await this.init();
        return this.db.data.messages
            .filter((m: any) => m.threadID === threadID)
            .slice(-limit);
    }

    // --- Knowledge Base (RAG) ---
    public async addKnowledge(content: string, source: string = "user") {
        if (!this.db) await this.init();
        
        const fact: Fact = {
            id: Math.random().toString(36).substring(7),
            content,
            source,
            timestamp: Date.now()
        };
        
        this.db.data.knowledge.push(fact);
        await this.db.write();
        return fact;
    }

    public async searchKnowledge(query: string, limit: number = 3): Promise<Fact[]> {
        if (!this.db) await this.init();
        
        const words = query.toLowerCase().split(/\s+/);
        return this.db.data.knowledge
            .filter((f: any) => {
                const content = f.content.toLowerCase();
                return words.some(word => content.includes(word));
            })
            .sort((a: any, b: any) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // --- Scheduling ---
    public async addSchedule(task: ScheduledTask) {
        if (!this.db) await this.init();
        this.db.data.schedules.push(task);
        await this.db.write();
    }

    public async getDueSchedules(): Promise<ScheduledTask[]> {
        if (!this.db) await this.init();
        const now = Date.now();
        return this.db.data.schedules.filter((s: any) => s.targetTimestamp <= now);
    }

    public async deleteSchedule(id: string) {
        if (!this.db) await this.init();
        this.db.data.schedules = this.db.data.schedules.filter((s: any) => s.id !== id);
        await this.db.write();
    }
}

export const db = new DatabaseService();
