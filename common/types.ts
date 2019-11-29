import { firestore } from 'firebase';

/** Player schema.
 *
 * Stored under `players/`.
 */
export interface Player {
  name: string;
  ldap: string;
  level: number;

  lastLevelUpdate?: firestore.Timestamp;
}

/**
 * Game record schema.
 *
 * Stored under `tables/{FoosballTable}/records`.
 */
export interface GameRecord {
  winners: string[];
  losers: string[];
  // If game is tie, we use `winners` and `losers` only to resolve
  // player team, without regarding as winning or losing.
  isDraw: boolean;
  // Number of consecutive wins for current game.
  winStreaks: number;
  // Game timestamp.
  createdAt: firestore.Timestamp;
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

  perSeason: {
    [key: string]: {
      totalWins: number;
      totalLoses: number;
    }
  };
  asOpponent: {
    [key: string]: {
      totalWins: number;
      totalLoses: number;
      recentGames: string;
    }
  };
  asTeammate: {
    [key: string]: {
      totalWins: number;
      totalLoses: number;
      recentGames: string;
    }
  };
}

/**
 * Team stats schema.
 *
 * Stored under `teamStats/`
 */
export interface TeamStats {
  totalWins: number;
  totalLoses: number;
  recentGames: string;
}

/**
 * Event schema.
 *
 * Stored under `events/`
 */
export interface Event {
  type: 'promotion' | 'demotion';
  createdAt: firestore.Timestamp;
}

export interface PromotionEvent extends Event {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}

export interface DemotionEvent extends Event {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}
