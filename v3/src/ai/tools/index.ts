import { sendMessageTool, unsendTool, editMessageTool } from "./messagingTool";
import { sendMediaTool } from "./mediaTool";
import { mentionTool } from "./socialTool";
import { getBotInfoTool } from "./botInfoTool";

export const tools = [
    sendMessageTool,
    unsendTool,
    editMessageTool,
    sendMediaTool,
    mentionTool,
    getBotInfoTool
];
