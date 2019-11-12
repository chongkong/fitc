import * as functions from 'firebase-functions';

import { Player, PlayerStats } from '../../../common/types';
import { firestore } from '../admin';

const ALLOWED_DOMAINS = [
  'google.com'
]

export const onUserCreate = functions.auth.user()
    .onCreate(user => {
      if (!user.email)
        return;
      const [ldap, domain] = user.email.split('@');
      if (!ALLOWED_DOMAINS.includes(domain))
        return;

      const promises = [];
      
      // 1. Create Player entry.
      const player: Player = {
        name: user.displayName || ldap,
        ldap,
        level: 1,
        isNewbie: true
      };
      promises.push(
          firestore.doc(`players/${ldap}`).set(player));

      // 2. Create PlayerStats entry.
      const playerStats: PlayerStats = {
        totalWins: 0,
        totalLoses: 0,
        mostWinStreaks: 0,
        recentGames: '',

        perSeason: {},
        asOpponent: {},
        asTeammate: {},
      };
      promises.push(
          firestore.doc(`stats/${player.ldap}`).set(playerStats));
      
      return Promise.all(promises);
    });
