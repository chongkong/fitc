import { GameRecord } from "../../common/types";

/**
 * Stored under `playerStates/`
 */
export interface PlayerState {
  recentGames: string;
}

export namespace PlayerState {
  export const path = (ldap: string) => `playerStates/${ldap}`;
  export const initial = (): PlayerState => ({
    recentGames: ""
  });
}

/**
 * Stored under `tableStates/`
 */
export interface TableState {
  lastRecord?: GameRecord;
}

export namespace TableState {
  export const path = (tableId: string) => `tableStates/${tableId}`;
  export const initial = (): TableState => ({});
}
