import { GameRecord } from "../../common/types";

/**
 * Stored under `playerStates/`
 */
export interface PlayerState {
  recentGames: string;
}

/**
 * Stored under `tableStates/`
 */
export interface TableState {
  lastRecord?: GameRecord;
}
