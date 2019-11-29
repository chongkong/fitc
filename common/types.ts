import { firestore } from "firebase";

/** Player schema.
 *
 * Stored under `players/`.
 */
export interface Player {
  name: string;
  ldap: string;
  level: number;
}

export namespace Player {
  export const path = (ldap: string) => `players/${ldap}`;

  export const create = ({
    name,
    ldap,
    level = 1
  }: {
    name: string;
    ldap: string;
    level: number;
  }): Player => ({ name, ldap, level });
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
  createdAt: firestore.Timestamp;
  // Player who recorded this game.
  recordedBy: string;
}

export namespace GameRecord {
  export const path = (tableId: string, timestamp: firestore.Timestamp) =>
    `tables/${tableId}/records/${timestamp.toMillis()}`;

  export const create = ({
    winners,
    losers,
    isDraw = false,
    winStreaks = 0,
    createdAt,
    recordedBy
  }: {
    winners: string[];
    losers: string[];
    isDraw: boolean;
    winStreaks?: number;
    createdAt: firestore.Timestamp;
    recordedBy: string;
  }): GameRecord => ({
    winners,
    losers,
    isDraw,
    winStreaks,
    createdAt: createdAt || firestore.Timestamp.now(),
    recordedBy
  });
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

export namespace FoosballTable {
  export const path = (tableId: string) => `tables/${tableId}`;
  export const create = (arg: FoosballTable) => arg;
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

export namespace PlayerStats {
  export const path = (ldap: string) => `playerStats/${ldap}`;

  export const empty = (): PlayerStats => ({
    totalWins: 0,
    totalLoses: 0,
    mostWinStreaks: 0,
    recentGames: ""
  });
}

/**
 * Stored under `playerStats/{ldap}/season`
 */
export interface SeasonStats {
  totalWins: number;
  totalLoses: number;
}

export namespace SeasonStats {
  export const path = (ldap: string, season: number | string) =>
    `playerStats/${ldap}/season/${season}`;

  export const empty = (): SeasonStats => ({
    totalWins: 0,
    totalLoses: 0
  });
}

/**
 * Stored under `playerStats/{ldap}/versus`
 */
export interface OpponentStats {
  totalWins: number;
  totalLoses: number;
  recentGames: string;
}

export namespace OpponentStats {
  export const path = (ldap: string, opponentLdap: string) =>
    `playerStats/${ldap}/versus/${opponentLdap}`;

  export const empty = (): OpponentStats => ({
    totalWins: 0,
    totalLoses: 0,
    recentGames: ""
  });
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

export namespace TeamStats {
  export const path = (...ldaps: string[]) =>
    `teamStats/${ldaps.sort().join(",")}`;

  export const empty = (): TeamStats => ({
    totalWins: 0,
    totalLoses: 0,
    mostWinStreaks: 0,
    recentGames: ""
  });
}

/**
 * Event schema.
 *
 * Stored under `events/`
 */
export interface Event {
  type: "promotion" | "demotion";
  createdAt: firestore.Timestamp;
}

export interface PromotionEvent extends Event {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}

export namespace PromotionEvent {
  export const path = (timestamp: firestore.Timestamp, ldap: string) =>
    `events/${timestamp.toMillis()}-promotion-${ldap}`;

  export const create = ({
    ldap,
    levelFrom,
    levelTo
  }: {
    ldap: string;
    levelFrom: number;
    levelTo?: number;
  }): PromotionEvent => ({
    type: "promotion",
    ldap,
    levelFrom,
    levelTo: levelTo || levelFrom + 1,
    createdAt: firestore.Timestamp.now()
  });
}

export interface DemotionEvent extends Event {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}

export namespace DemotionEvent {
  export const path = (timestamp: firestore.Timestamp, ldap: string) =>
    `events/${timestamp.toMillis()}-demotion-${ldap}`;

  export const create = ({
    ldap,
    levelFrom,
    levelTo
  }: {
    ldap: string;
    levelFrom: number;
    levelTo?: number;
  }): DemotionEvent => ({
    type: "demotion",
    ldap,
    levelFrom,
    levelTo: levelTo || levelFrom - 1,
    createdAt: firestore.Timestamp.now()
  });
}
