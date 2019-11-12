import * as functions from 'firebase-functions';

import { Player, PlayerStats } from '../../../common/types';
import { firestore } from '../admin';

const ALLOWED_DOMAINS = [
  'google.com'
]

function createNewPlayer(name: string, ldap: string): Player {
  return {
    name,
    ldap,
    level: 1,
    isNewbie: true
  }
}

function createNewPlayerStats(): PlayerStats {
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

export const onUserCreate = functions.auth.user()
    .onCreate(user => {
      if (!user.email)
        return;
      const [ldap, domain] = user.email.split('@');
      if (!ALLOWED_DOMAINS.includes(domain))
        return;

      const promises = [];
      
      // 1. Create Player entry.
      const playerDoc = firestore.doc(`players/${ldap}`);
      promises.push(
        playerDoc.get().then(snapshot => {
          return snapshot.exists ? undefined : playerDoc.set(
              createNewPlayer(user.displayName || ldap, ldap));
        })
      );

      // 2. Create PlayerStats entry.
      promises.push(
        firestore.doc(`stats/${ldap}`).set(createNewPlayerStats())
      );
      
      return Promise.all(promises);
    });
