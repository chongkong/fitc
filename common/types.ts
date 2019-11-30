import { Timestamp } from "./platform/base";

/** Player schema.
 *
 * Stored under `players/`.
 */
export interface Player {
  name: string;
  ldap: string;
  level: number;
}

/**
 * Game record schema.
 *
 * Stored under `tables/{FoosballTable}/records`.
 */
export interface GameRecord {
  winners: string[];
  losers: string[];
  // If game is draw, we use `winners` and `losers` only to resolve
  // player team, without regarding of winning or losing.
  isDraw: boolean;
  // Number of consecutive wins for current game.
  winStreaks: number;
  // Game timestamp.
  createdAt: Timestamp;
  // Player who recorded this game.
  recordedBy: string;
}

/**
 * Foosball table schema.
 *
 * Stored under `tables/`.
 */
export interface FoosballTable {
  name: string;
  recentPlayers: string[];
}

/**
 * Player stats schema.
 *
 * Stored under `playerStats/`
 */
export interface PlayerStats {
  totalWins: number;
  totalLoses: number;
  mostWinStreaks: number;
  recentGames: string;
}

/**
 * Stored under `playerStats/{ldap}/seasons`
 */
export interface SeasonStats {
  totalWins: number;
  totalLoses: number;
}

/**
 * Stored under `playerStats/{ldap}/rivals`
 */
export interface RivalStats {
  totalWins: number;
  totalLoses: number;
  recentGames: string;
}

/**
 * Team stats schema.
 *
 * Stored under `teamStats/`
 */
export interface TeamStats {
  totalWins: number;
  totalLoses: number;
  mostWinStreaks: number;
  recentGames: string;
}

/**
 * Event schema.
 *
 * Stored under `events/`
 */
interface BaseEvent {
  type: "promotion" | "demotion";
  createdAt: Timestamp;
}

export interface PromotionEvent extends BaseEvent {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}

export interface DemotionEvent extends BaseEvent {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}

export type Event = PromotionEvent | DemotionEvent;
