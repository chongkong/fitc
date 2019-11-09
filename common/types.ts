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
}

/**
 * Player snapshot that is used in `GameRecord`.
 */
export interface PlayerSnapshot {
  playerId: string;
  level: number;
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
}

/**
 * Foosball table schema.
 * 
 * Stored under `tables/`.
 */
export interface FoosballTable {
  name: string;
  lastRecord?: GameRecord;
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
  mostStreaks: number;
  recentGames: string;

  perYear: {
    [key: number]: {
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
