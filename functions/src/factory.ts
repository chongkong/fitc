import { firestore } from 'firebase-admin';
import { Player, PlayerStats, PromotionEvent, DemotionEvent, FoosballTable, TeamStats } from '../../common/types';

export function createNewTable(name: string, recentPlayers: string[]): FoosballTable {
  return {
    name,
    recentPlayers,
  };
}

export function createNewPlayer(name: string, ldap: string): Player {
  return {
    name,
    ldap,
    level: 1
  }
}

export function createNewPlayerStats(): PlayerStats {
  return {
    totalWins: 0,
    totalLoses: 0,
    mostWinStreaks: 0,
    recentGames: '',

    perSeason: {},
    asOpponent: {},
    asTeammate: {},
  };
}

export function createNewTeamStats(): TeamStats {
  return {
    totalWins: 0,
    totalLoses: 0,
    recentGames: '',
  };
}

export function createPromotionEvent(ldap: string, levelFrom: number, createdAt: firestore.Timestamp): PromotionEvent {
  return {
    type: 'promotion',
    ldap,
    levelFrom,
    levelTo: levelFrom + 1,
    createdAt
  };
}

export function createDemotionEvent(ldap: string, levelFrom: number, createdAt: firestore.Timestamp): DemotionEvent {
  return {
    type: 'demotion',
    ldap,
    levelFrom,
    levelTo: levelFrom - 1,
    createdAt
  };
}
