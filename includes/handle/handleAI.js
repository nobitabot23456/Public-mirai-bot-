const { runAkaneAgent, injectMemory } = require("../../src/ai/agent");

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const handleCommand = require("./handleCommand")({ api, models, Users, Threads, Currencies, ...rest });

  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
      return;
    }

    const trimmedBody = body.trim();
    
    const commands = global.client.commands;
    let isCommand = false;
    let matchedCommandName = null;
    let matchedArgs = "";

    const mentionRegex = /^akane\b/i; // Only match if the sentence starts with her name
    const botID = api.getCurrentUserID();
    const isReplyToBot = event.messageReply && event.messageReply.senderID === botID;
    const isPM = event.senderID === threadID;

    // (A) Shared Context Logic: Akane stays "awake" for the whole group for 60 seconds after her last reply.
    if (!global.akaneState) global.akaneState = {};
    if (!global.akaneState[threadID]) global.akaneState[threadID] = { lastRepliedTime: 0, pendingUser: null, pendingTime: 0 };
    
    const now = Date.now();
    // Awake if she spoke recently OR if she is currently "thinking" for this user
    const isConsecutiveTalk = !isPM && (
        (now - global.akaneState[threadID].lastRepliedTime < 60000) || 
        (global.akaneState[threadID].pendingUser === senderID && now - global.akaneState[threadID].pendingTime < 15000)
    );
    
    if (global.akaneState[threadID].lastRepliedTime > 0 && !isConsecutiveTalk) {
        console.log(`[LOCK] Expired for thread ${threadID} (Silent Mode restored)`);
        global.akaneState[threadID].lastRepliedTime = 0;
        global.akaneState[threadID].pendingUser = null;
    }




    // Fast track explicit prefixed commands
    if (trimmedBody.startsWith(global.config.PREFIX)) {
      const commandName = trimmedBody.slice(global.config.PREFIX.length).split(/\s+/)[0].toLowerCase();
      // Only treat as command if it actually exists in the client
      if (global.client.commands.has(commandName) || 
          Array.from(global.client.commands.values()).some(c => c.config && c.config.aliases && c.config.aliases.includes(commandName))) {
        isCommand = true;
      }
    } 


    if (isCommand) {
      // Proxy api.sendMessage strictly to read the bot's response and save it to the AI's memory
      const proxyApi = { ...api };
      proxyApi.sendMessage = function (msg, tid, cb, mid) {
          let textLog = "[Rich Attachment / Canvas / No Text]";
          if (typeof msg === 'string') textLog = msg;
          else if (msg && msg.body) textLog = msg.body;
          
          injectMemory(event, trimmedBody, textLog).catch(e => console.error(e));
          
          // Call original sendMessage
          return api.sendMessage(msg, tid, cb, mid);
      };

      handleCommand({ event, api: proxyApi, ...rest2 });
      return;
    }
    // --- GROUP CHAT HISTORY LOGIC --- //
    if (!global.gcHistory) global.gcHistory = {};
    if (!global.gcHistory[threadID]) global.gcHistory[threadID] = [];

    let senderName = "User";
    try {
        senderName = await Users.getNameUser(senderID) || senderID;
    } catch(e) {}

    // Add to rolling history
    global.gcHistory[threadID].push(`[${senderName}]: ${trimmedBody}`);
    if (global.gcHistory[threadID].length > 15) {
        global.gcHistory[threadID].shift();
    }

    // Determine how to route to Akane Owari AI
    let aiPrompt = trimmedBody;
    
    const isDirectMention = mentionRegex.test(trimmedBody);
    const isExplicitlyCalled = isPM || isDirectMention || isReplyToBot || isConsecutiveTalk;
    
    console.log(`[AI ROUTE] sender=${senderID} isPM=${isPM} mention=${isDirectMention} replyBot=${isReplyToBot} lock=${isConsecutiveTalk} → ${isExplicitlyCalled ? 'ENGAGE' : 'SILENT'}`);
    
    if (!isExplicitlyCalled) {
        // AMBIENT GC MODE: The humans are talking to each other.
        // We do NOT hit the LLM. We just silently recorded their conversation history above.
        return;
    } else if (!isPM) {
        // EXPLICIT GC MENTION: They brought up Akane in the group chat!
        // So we feed her what everyone was just saying so she is totally aware of the context!
        aiPrompt = `[GROUP CHAT CONTEXT (Last 15 Messages)]\n`;
        aiPrompt += global.gcHistory[threadID].join("\n");
        aiPrompt += `\n\n[SYSTEM CHECK] The above is humans talking in a group chat. The user has just explicitly addressed you. Reply to their message naturally:\n${trimmedBody}`;
    }

    // AI logic starts here for non-prefixed or conversational messages
    // [REMOVED TYPING INDICATOR PER USER REQUEST]

    // Set pending state to keep lock fluid while thinking
    global.akaneState[threadID].pendingUser = senderID;
    global.akaneState[threadID].pendingTime = Date.now();
    
    try {

        const response = await runAkaneAgent(api, event, aiPrompt);
        
        // Clear pending state once done
        if (global.akaneState[threadID].pendingUser === senderID) {
            global.akaneState[threadID].pendingUser = null;
        }

        // Let the bot actually reply with the text response if she didn't choose to ignore
        if (response && response.trim() !== 'IGNORE' && typeof response === 'string' && response.trim().length > 0) {
            api.sendMessage(response, threadID, messageID);
            
            // Stay "awake" in this thread for the next 60 seconds
            global.akaneState[threadID].lastRepliedTime = Date.now();

            // push her own reply to history so she remembers what she said
            global.gcHistory[threadID].push(`[Akane Owari (You)]: ${response}`);
            if (global.gcHistory[threadID].length > 15) global.gcHistory[threadID].shift();
        } else if (response && response.trim() === 'IGNORE') {
            console.log(`[AI ROUTE] Akane chose to IGNORE this message. Returning to Silent Mode.`);
            // Force silence immediately
            global.akaneState[threadID].lastRepliedTime = 0;
            global.akaneState[threadID].pendingUser = null;
        }
    } catch (error) {
        console.error("Agent failed:", error);
    }
  };
};