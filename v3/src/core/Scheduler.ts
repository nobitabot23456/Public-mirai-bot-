import cron from 'node-cron';
import { db, ScheduledTask } from './Database';

class SchedulerService {
    private api: any;

    private cronTask: any;

    public init(api: any) {
        this.api = api;
        // Check for due tasks every minute
        this.cronTask = cron.schedule('* * * * *', () => {
            this.checkTasks();
        });
        console.log("[ SCHEDULER ] Message Scheduler Started.");
    }

    public stop() {
        if (this.cronTask) {
            this.cronTask.stop();
            console.log("[ SCHEDULER ] Message Scheduler Stopped.");
        }
    }

    private async checkTasks() {
        const dueTasks = await db.getDueSchedules();
        if (dueTasks.length === 0) return;

        console.log(`[ SCHEDULER ] Processing ${dueTasks.length} due tasks...`);

        for (const task of dueTasks) {
            try {
                await this.executeTask(task);
                await db.deleteSchedule(task.id);
            } catch (error) {
                console.error(`[ SCHEDULER ] Failed to execute task ${task.id}:`, error);
            }
        }
    }

    private executeTask(task: ScheduledTask): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.api) return reject("API not initialized");
            this.api.sendMessage(task.text, task.threadID, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    public async addShortTermTask(task: ScheduledTask, delayMs: number) {
        // For very short tasks, we can use setTimeout as well for instant gratification
        // but still save it to DB just in case of crash
        await db.addSchedule(task);
        
        if (delayMs < 60000) { // If less than a minute, run a timeout too
             setTimeout(async () => {
                 // Double check if it still exists (might have been processed by cron)
                 const currentTasks = await db.getDueSchedules();
                 if (currentTasks.some(t => t.id === task.id)) {
                     await this.executeTask(task);
                     await db.deleteSchedule(task.id);
                 }
             }, delayMs);
        }
    }
}

export const scheduler = new SchedulerService();
