export interface CommandConfig {
    name: string;
    aliases?: string[];
    author?: string;
    category?: string;
    cooldowns?: number;
    hasPermission?: number;
    description: string;
    usages?: string;
    usePrefix?: boolean;
}

export interface Command {
    config: CommandConfig;
    run: (context: CommandContext) => Promise<any>;
}

export interface CommandContext {
    api: any;
    event: any;
    message: any;
    config: any;
    saveConfig: () => void;
    commands: Map<string, Command>;
    args: string[];
}
