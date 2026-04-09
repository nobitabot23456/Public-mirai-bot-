const { ChatOpenAI } = require("@langchain/openai");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { MemorySaver } = require("@langchain/langgraph");
const { getSystemPrompt } = require("./personaManager");
const { loadCommandTools } = require("./tools");

// Defaulting to the user's provided Kilo token from previous scripts
const kiloToken = process.env.KILO_API_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnYiOiJwcm9kdWN0aW9uIiwia2lsb1VzZXJJZCI6IjRmYjU5MDEzLWUyYTUtNDQ2Zi04ZDExLWY5MzgwNjU0ZDYwMSIsImFwaVRva2VuUGVwcGVyIjpudWxsLCJ2ZXJzaW9uIjozLCJpYXQiOjE3NzM5MTIzMTAsImV4cCI6MTkzMTU5MjMxMH0.eoT9XuLmV5y1FWgU1W-wTm4lK3S0UwRw4BRone4US7A";

const model = new ChatOpenAI({
    apiKey: "dummy", // The Go service handles the actual token injection for OpenRouter via .env
    configuration: {
        baseURL: "http://127.0.0.1:3000/v2"
    },
    // Timeout is part of the first argument object in newer LangChain versions, 
    // but here we ensure it's handled correctly.
    modelName: "google/gemini-2.5-flash-lite"
}, {
    timeout: 35000
});

const checkpointer = new MemorySaver();
// Cache a base agent (no tools) for fast memory injection
const baseAgent = createReactAgent({ llm: model, tools: [], checkpointSaver: checkpointer });

async function runAkaneAgent(api, event, userInput) {
    const threadId = event.threadID;
    const tools = loadCommandTools(api, event);
    const systemPrompt = getSystemPrompt();

    // We still create the full agent for tool-enabled talk, 
    // but the systemPrompt is now dynamic and tools are fresh.
    const agent = createReactAgent({
        llm: model,
        tools,
        checkpointSaver: checkpointer,
        stateModifier: systemPrompt
    });

    const config = { configurable: { thread_id: threadId } };

    try {
        const result = await agent.invoke({ messages: [["user", userInput]] }, config);

        // Optimized token extraction
        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage.usage_metadata) {
            const { total_tokens } = lastMessage.usage_metadata;
            console.log(`[STATE] Sent reply (${total_tokens} tokens)`);
        }
        
        return lastMessage.content;
    } catch (err) {
        console.error("Agent error:", err);
        return "Ugh, my head hurts... something went wrong. I think I need to eat some meat and try again.";
    }
}

async function injectMemory(event, userInput, botReply) {
    const threadId = event.threadID;
    const config = { configurable: { thread_id: threadId } };

    try {
        // Use the CACHED base agent for lightning fast state updates
        await baseAgent.updateState(config, {
            messages: [
                ["user", userInput],
                ["assistant", `[ACTION PROCESSED NATIVELY]: ${botReply}`]
            ]
        });
        console.log(`[STATE] Injected native memory for thread ${threadId}`);
    } catch (e) {
        // Fail silently or log minimally
    }
}


module.exports = { runAkaneAgent, injectMemory };

