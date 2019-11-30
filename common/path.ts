import { Timestamp } from "./platform/base";

export namespace Path {
  export const playersCollection = "players";
  export const player = (ldap: string) => `players/${ldap}`;

  export const tablesCollection = "tables";
  export const table = (tableId: string) => `tables/${tableId}`;
  export const gameRecordCollection = (tableId: string) =>
    `tables/${tableId}/records`;
  export const gameRecord = (tableId: string, timestamp: Timestamp) =>
    `tables/${tableId}/records/${timestamp.toMillis()}`;

  export const playerStatsCollection = "playerStats";
  export const playerStats = (ldap: string) => `playerStats/${ldap}`;
  export const seasonStatsCollection = (ldap: string) =>
    `playerStats/${ldap}/seasons`;
  export const seasonStats = (ldap: string, season: string | number) =>
    `playerStats/${ldap}/seasons/${season}`;
  export const rivalStatsCollection = (ldap: string) =>
    `playerStats/${ldap}/rivals`;
  export const rivalStats = (ldap: string, rival: string) =>
    `playerStats/${ldap}/rivals/${rival}`;

  export const teamStatsCollection = "teamStats";
  export const teamStats = (...ldaps: string[]) =>
    `teamStats/${ldaps.sort().join(",")}`;

  export const eventsCollection = "events";
  export const promotionEvent = (timestamp: Timestamp, ldap: string) =>
    `events/${timestamp.toMillis()}-promotion-${ldap}`;
  export const demotionEvent = (timestamp: Timestamp, ldap: string) =>
    `events/${timestamp.toMillis()}-demotion-${ldap}`;

  export const tableStatesCollection = "tableStates";
  export const tableState = (ldap: string) => `tableStats/${ldap}`;

  export const playerStatesCollection = "playerStates";
  export const playerState = (ldap: string) => `playerStats/${ldap}`;
}
