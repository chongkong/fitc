/** Player schema.
 *
 * Stored under `players/`.
 */
export interface Player {
  name: string;
  ldap: string;
  level: number;

  // Whether the player has newly joined and kept level 1 or not.
  isNewbie: boolean;
  lastLevelUpdate?: Date;
}

/**
 * Player snapshot that is used in `GameRecord`.
 */
export interface PlayerSnapshot {
  ldap: string;
  level?: number;
}

/**
 * Game record schema.
 *
 * Stored under `tables/{FoosballTable}/records`.
 */
export interface GameRecord {
  winners: PlayerSnapshot[];
  losers: PlayerSnapshot[];
  // If game is tie, we use `winners` and `losers` only to resolve
  // player team, without regarding as winning or losing.
  isTie: boolean;
  // Number of consecutive wins for current game.
  winStreaks: number;
  // Game timestamp.
  createdAt: Date;
  // Player who recorded this game.
  recordedBy: string;
  // Flag to prevent event update (for old data migration)
  preventEvent?: boolean;
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
 * Event schema.
 *
 * Stored under `events/`
 */
export interface Event {
  type: 'promotion' | 'demotion';
  payload: PromotionEvent | DemotionEvent;
  createdAt: Date;
}

export interface PromotionEvent {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}

export interface DemotionEvent {
  ldap: string;
  levelFrom: number;
  levelTo: number;
}
