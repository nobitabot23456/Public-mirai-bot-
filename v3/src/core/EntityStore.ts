// src/core/EntityStore.ts

/**
 * Per-user Entity Store.
 *
 * Tracks structured attributes about individual users so the bot can
 * recall things like names, birthdays, and preferences with full
 * per-user isolation.  Persisted to data/entities.json via lowdb.
 */

import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './Logger';

const ENTITY_PATH = path.join(__dirname, '../../data/entities.json');

export interface UserEntity {
  /** Facebook user ID */
  userID: string;
  /** Display name, set when the user introduces themselves */
  name?: string;
  /** Any free-form key/value attributes (birthday, location, etc.) */
  attributes: Record<string, string>;
  /** ISO timestamp of last update */
  updatedAt: string;
}

interface EntityData {
  users: UserEntity[];
}

const DEFAULT_DATA: EntityData = { users: [] };

class EntityStoreService {
  private db: any;

  constructor() {
    fs.ensureDirSync(path.dirname(ENTITY_PATH));
  }

  public async init() {
    this.db = await JSONFilePreset<EntityData>(ENTITY_PATH, DEFAULT_DATA);
    this.db.data.users = this.db.data.users || [];
    logger.info('ENTITY', 'EntityStore initialized');
  }

  private async ensure() {
    if (!this.db) await this.init();
  }

  /** Return the entity record for a user, creating it if absent */
  public async getOrCreate(userID: string): Promise<UserEntity> {
    await this.ensure();
    let user = this.db.data.users.find((u: UserEntity) => u.userID === userID);
    if (!user) {
      user = { userID, attributes: {}, updatedAt: new Date().toISOString() };
      this.db.data.users.push(user);
      await this.db.write();
      logger.info('ENTITY', 'New entity created', { userID });
    }
    return user;
  }

  /** Update one or more attributes for a user */
  public async setAttribute(
    userID: string,
    key: string,
    value: string
  ): Promise<UserEntity> {
    await this.ensure();
    const user = await this.getOrCreate(userID);
    user.attributes[key] = value;
    user.updatedAt = new Date().toISOString();
    // alias: keep top-level 'name' in sync with the 'name' attribute
    if (key === 'name') user.name = value;
    await this.db.write();
    logger.info('ENTITY', 'Attribute set', { userID, key, value });
    return user;
  }

  /** Get a specific attribute for a user */
  public async getAttribute(
    userID: string,
    key: string
  ): Promise<string | undefined> {
    await this.ensure();
    const user = this.db.data.users.find((u: UserEntity) => u.userID === userID);
    return user?.attributes[key];
  }

  /** Serialise the full entity record to a string for LLM injection */
  public async toContextString(userID: string): Promise<string> {
    await this.ensure();
    const user = this.db.data.users.find((u: UserEntity) => u.userID === userID);
    if (!user) return '';

    const lines: string[] = [`[Entity: User ${userID}]`];
    if (user.name) lines.push(`  Name: ${user.name}`);
    for (const [k, v] of Object.entries(user.attributes)) {
      if (k !== 'name') lines.push(`  ${k}: ${v}`);
    }
    return lines.join('\n');
  }

  /** Get all users (for admin / debug) */
  public async allUsers(): Promise<UserEntity[]> {
    await this.ensure();
    return this.db.data.users;
  }
}

export const entityStore = new EntityStoreService();
