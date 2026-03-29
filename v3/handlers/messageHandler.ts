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
        reply: (text: string) => {
            return new Promise((resolve, reject) => {
                api.sendMessage(text, threadID, (err: any, info: any) => {
                    if (err) {
                        console.error(`[ ERROR ] Reply failed:`, err);
                        reject(err);
                    } else {
                        console.log(`[ SUCCESS ] Reply sent to ${threadID}`);
                        resolve(info);
                    }
                }, messageID, event.isGroup);
            });
        },
        
        send: (text: string) => {
            return new Promise((resolve, reject) => {
                api.sendMessage(text, threadID, (err: any, info: any) => {
                    if (err) {
                        console.error(`[ ERROR ] Send failed:`, err);
                        reject(err);
                    } else {
                        console.log(`[ SUCCESS ] Message sent to ${threadID}`);
                        resolve(info);
                    }
                }, null, event.isGroup);
            });
        },
        
        react: (reaction: string) => {
            return new Promise((resolve, reject) => {
                api.setMessageReaction(reaction, messageID, (err: any) => {
                    if (err) reject(err);
                    else resolve(true);
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
