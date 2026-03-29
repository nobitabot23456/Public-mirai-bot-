import { getConfig } from "./Config";

export function getPermissionLevel(senderID: string): number {
    const config = getConfig();
    if (config.BOTOWNER?.includes(senderID)) return 2;
    if (config.ADMINBOT?.includes(senderID)) return 1;
    return 0;
}

export function checkPermission(senderID: string, requiredLevel: number): boolean {
    return getPermissionLevel(senderID) >= requiredLevel;
}
