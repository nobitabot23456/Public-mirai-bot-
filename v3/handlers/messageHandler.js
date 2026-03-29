/**
 * messageHandler.js - A unified wrapper for messages in Cyber-Bot v3
 * Provides easy access to properties and helper methods for replying/sending.
 */

module.exports = function({ api, event }) {
  const { 
    threadID, 
    messageID, 
    senderID, 
    body, 
    type, 
    attachments, 
    mentions, 
    isGroup,
    ...rest 
  } = event;

  return {
    // 1. References to raw objects
    api,
    event,
    
    // 2. Convenience properties
    uid: senderID,
    tid: threadID,
    mid: messageID,
    body: body || "",
    args: (body || "").trim().split(/\s+/),
    type,
    attachments: attachments || [],
    mentions: mentions || {},
    isGroup: isGroup || false,
    
    // 3. Helper Methods for Actions
    /**
     * Reply directly to the incoming message
     * @param {string|object} content - The message text or attachment object
     * @param {function} [callback] - Optional callback
     */
    reply: (content, callback) => {
      return api.sendMessage(content, threadID, messageID, callback);
    },
    
    /**
     * Send a message to the current thread (or another targeted thread)
     * @param {string|object} content - The message text or attachment object
     * @param {string} [targetTID] - Optional Thread ID (defaults to current)
     * @param {function} [callback] - Optional callback
     */
    send: (content, targetTID = threadID, callback) => {
      return api.sendMessage(content, targetTID, callback);
    },
    
    /**
     * Add a reaction to the incoming message
     * @param {string} emoji - The emoji to react with
     * @param {function} [callback] - Optional callback
     */
    react: (emoji, callback) => {
      return api.setMessageReaction(emoji, messageID, callback, true);
    },
    
    /**
     * Unsend a message
     * @param {string} [targetMID] - Optional Message ID (defaults to current)
     */
    unsend: (targetMID = messageID) => {
      return api.unsendMessage(targetMID);
    },

    // 4. Expose all other original event properties
    ...rest
  };
};
