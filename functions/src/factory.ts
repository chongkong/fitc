import { Player, PlayerStats } from '../../common/types';

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
