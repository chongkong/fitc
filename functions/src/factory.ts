import { firestore } from 'firebase-admin';
import { Player, PlayerStats, Event, FoosballTable, TeamStats } from '../../common/types';

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

export function createPromotionEvent(ldap: string, levelFrom: number, createdAt: firestore.Timestamp): Event {
  return {
    type: 'promotion', 
    payload: {
      ldap,
      levelFrom,
      levelTo: levelFrom + 1,
    },
    createdAt
  } as Event;
}

export function createDemotionEvent(ldap: string, levelFrom: number, createdAt: firestore.Timestamp): Event {
  return {
    type: 'demotion', 
    payload: {
      ldap,
      levelFrom,
      levelTo: levelFrom - 1,
    },
    createdAt
  } as Event;
}
