// src/ai/tools/entityTool.ts

/**
 * Tools for reading and writing structured per-user entity data.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { entityStore } from '../../core/EntityStore';
import { withToolMiddleware } from './middleware';

/** Read a user's entity context */
export const getUserEntityTool = tool(
  withToolMiddleware(
    async ({ userID }: { userID: string }) => {
      const ctx = await entityStore.toContextString(userID);
      return ctx || `No entity data found for user ${userID}.`;
    },
    'getUserEntity'
  ),
  {
    name: 'getUserEntity',
    description:
      "Retrieve structured memory (name, birthday, preferences, etc.) for a specific user by their ID. Use this when someone asks 'who am I?' or 'what do you know about me?'",
    schema: z.object({
      userID: z.string().describe('The Facebook user ID to look up'),
    }),
  }
);

/** Write / update an attribute on a user entity */
export const setUserAttributeTool = tool(
  withToolMiddleware(
    async (
      { userID, key, value }: { userID: string; key: string; value: string },
      config: any
    ) => {
      // Fall back to the event sender if no explicit userID is provided
      const resolvedID =
        userID || (config as any)?.configurable?.event?.senderID;
      if (!resolvedID) return 'Error: could not determine user ID.';

      const entity = await entityStore.setAttribute(resolvedID, key, value);
      return `Saved: ${key} = "${value}" for user ${resolvedID} (name: ${entity.name ?? 'unknown'}).`;
    },
    'setUserAttribute'
  ),
  {
    name: 'setUserAttribute',
    description:
      "Store a structured fact about a specific user (e.g. name, birthday, job, hobby). Use this whenever someone tells you something personal about themselves.",
    schema: z.object({
      userID: z
        .string()
        .describe('The Facebook user ID. Use the senderID from context.'),
      key: z
        .string()
        .describe(
          "Attribute key, e.g. 'name', 'birthday', 'job', 'city', 'hobby'"
        ),
      value: z.string().describe('The value to store'),
    }),
  }
);
