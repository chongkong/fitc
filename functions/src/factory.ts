import { Player, PlayerStats, Event, FoosballTable } from '../../common/types';

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
    level: 1,
    isNewbie: true
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

export function createPromotionEvent(ldap: string, levelFrom: number, createdAt: Date): Event {
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

export function createDemotionEvent(ldap: string, levelFrom: number, createdAt: Date): Event {
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
