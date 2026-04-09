import { sendMessageTool, unsendTool } from "./messagingTool";
import { sendMediaTool } from "./mediaTool";
import { mentionTool, getUserInfoTool, reactToMessageTool } from "./socialTool";
import { getBotInfoTool } from "./botInfoTool";
import { knowledgeTool } from "./knowledgeTool";
import { saveMemoryTool } from "./saveMemoryTool";
import { searchTool } from "./searchTool";
import { scheduleTool } from "./scheduleTool";
import { getUserEntityTool, setUserAttributeTool } from "./entityTool";
import {
  getThreadInfoTool,
  changeGroupNameTool,
  setNicknameTool,
  createPollTool,
  changeThreadEmojiTool,
} from "./groupTool";
import { markAsReadTool, shareContactTool } from "./threadTool";
import {
  addMemberTool,
  kickMemberTool,
  setAdminTool,
  changeThreadColorTool,
  muteThreadTool,
  createGroupTool,
} from "./adminTool";

export const tools = [
  // Messaging
  sendMessageTool,
  unsendTool,

  // Media
  sendMediaTool,

  // Social
  mentionTool,
  getUserInfoTool,
  reactToMessageTool,

  // Knowledge & Memory
  getBotInfoTool,
  knowledgeTool,
  saveMemoryTool,
  getUserEntityTool,
  setUserAttributeTool,

  // Search & Schedule
  searchTool,
  scheduleTool,

  // Group Management (new)
  getThreadInfoTool,
  changeGroupNameTool,
  setNicknameTool,
  createPollTool,
  changeThreadEmojiTool,

  // Thread Utilities
  markAsReadTool,
  shareContactTool,

  // Admin Tools (new)
  addMemberTool,
  kickMemberTool,
  setAdminTool,
  changeThreadColorTool,
  muteThreadTool,
  createGroupTool,
];
