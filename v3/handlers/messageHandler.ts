/**
 * Unified message handler for all incoming events
 * Provides convenience properties and helper methods
 */
export interface MessageHandlerParams {
    api: any;
    event: any;
}

export function messageHandler({ api, event }: MessageHandlerParams) {
    const { body, senderID, threadID, messageID, attachments } = event;

    return {
        // Properties
        body: body || "",
        uid: senderID,
        tid: threadID,
        mid: messageID,
        attachments: attachments || [],
        
        // Helper methods
        reply: (msg: string | any) => {
            const text = typeof msg === "string" ? msg : (msg.body || "");
            const truncated = text.split("\n")[0].substring(0, 50) + (text.includes("\n") || text.length > 50 ? "..." : "");
            return new Promise((resolve, reject) => {
                api.sendMessage(msg, threadID, (err: any, info: any) => {
                    if (err) {
                        console.error(`[ ERROR ] Reply failed:`, err);
                        reject(err);
                    } else {
                        console.log(`[ SUCCESS ] Reply sent to ${threadID}: "${truncated}"`);
                        resolve(info);
                    }
                }, messageID);
            });
        },
        
        send: (msg: string | any) => {
            const text = typeof msg === "string" ? msg : (msg.body || "");
            const truncated = text.split("\n")[0].substring(0, 50) + (text.includes("\n") || text.length > 50 ? "..." : "");
            return new Promise((resolve, reject) => {
                api.sendMessage(msg, threadID, (err: any, info: any) => {
                    if (err) {
                        console.error(`[ ERROR ] Send failed:`, err);
                        reject(err);
                    } else {
                        console.log(`[ SUCCESS ] Message sent to ${threadID}: "${truncated}"`);
                        resolve(info);
                    }
                }, null);
            });
        },
        
        react: (reaction: string) => {
            return new Promise((resolve) => {
                api.setMessageReaction(reaction, messageID, (err: any) => {
                    if (err) console.error(`[ ERROR ] Reaction failed (${reaction}):`, err);
                    resolve(true); // Always resolve to avoid crashing command
                });
            });
        },
        
        reaction: (reaction: string) => {
            return new Promise((resolve) => {
                api.setMessageReaction(reaction, messageID, (err: any) => {
                    if (err) console.error(`[ ERROR ] Reaction failed (${reaction}):`, err);
                    resolve(true); // Always resolve to avoid crashing command
                });
            });
        },
        
        unsend: () => {
            return new Promise((resolve, reject) => {
                api.unsendMessage(messageID, (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    };
}
