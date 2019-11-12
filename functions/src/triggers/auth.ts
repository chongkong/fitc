import * as functions from 'firebase-functions';

import { Player, PlayerStats } from 'common/types';
import { firestore } from 'functions/src/admin';

const ALLOWED_DOMAINS = [
  'google.com'
]

export const onUserCreate = functions.auth.user()
    .onCreate(user => {
      if (!user.email)
        return;
      let [ldap, domain] = user.email!.split('@');
      if (!ALLOWED_DOMAINS.includes(domain))
        return;

      let promises = [];
      
      // 1. Create Player entry.
      let player: Player = {
        name: user.displayName || ldap,
        ldap,
        level: 1,
        isNewbie: true
      };
      promises.push(
          firestore.doc(`players/${ldap}`).set(player));

      // 2. Create PlayerStats entry.
      let playerStats: PlayerStats = {
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
