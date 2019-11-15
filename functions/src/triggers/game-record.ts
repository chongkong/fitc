// Trigger on GameRecord document creation/modification.

import * as functions from 'firebase-functions';

import { GameRecord, Player, PlayerStats } from '../../../common/types';
import { firestore, firebaseAuth } from '../admin';
import { PROMO_THRESHOLD } from '../data';
import { createNewPlayerStats, createPromotionEvent, createDemotionEvent } from '../factory';
import { setEquals } from '../../../common/utils';


export const onGameRecordCreate = functions.firestore
    .document('tables/default/records/{recordId}')
    .onCreate(async (snapshot, context) => {
      const rawRecord = snapshot.data() as GameRecord;
      const deferred: Promise<any>[] = [];

      const record = await sanitizeRecord(rawRecord, context);
      if (record.winStreaks != rawRecord.winStreaks) {
        deferred.push(snapshot.ref.set(record));
      }

      if (!record.isTie) {
        const {winners, losers, winStreaks} = record;
        const [w1, w2] = winners;
        const [l1, l2] = losers;

        deferred.push(
          updateWinStats(w1, w2, losers, winStreaks),
          updateWinStats(w2, w1, losers, winStreaks),
          updateLoseStats(l1, l2, winners),
          updateLoseStats(l2, l1, winners),
        );

        if (!record.preventEvent) {
          deferred.push(
            checkEvent(w1),
            checkEvent(w2),
            checkEvent(w1),
            checkEvent(w2),
          );
        }
      }

      return Promise.all(deferred);
    });

async function sanitizeRecord(dirty: GameRecord, context: functions.EventContext) {
  const sanitized: GameRecord = Object.assign({}, dirty);
  const deferred = [];

  // Check winStreaks
  if (dirty.isTie) {
    sanitized.winStreaks = 0;
  } else {
    deferred.push(
      getPreviousRecord(dirty.createdAt).then(prev => {
        if (prev && !prev.isTie 
            && isConsecutivePlay(prev, dirty)
            && setEquals(prev.winners, dirty.winners)) {
          sanitized.winStreaks = prev.winStreaks + 1;
        } else {
          sanitized.winStreaks = 1;
        }
      })
    );
  }

  // Check recordedBy
  if (context.authType === 'ADMIN') {
    sanitized.recordedBy = 'admin';
  } else if (context.auth) {
    deferred.push(
      firebaseAuth.getUser(context.auth.uid)
        .then(user => {
          if (user.email) {
            const [ldap, domain] = user.email.split('@');
            if (domain == 'google.com') {
              sanitized.recordedBy = ldap;
            }
          }
        })
    );
  }

  await Promise.all(deferred);

  return sanitized;
}

async function getPreviousRecord(before: Date) {
  const prevRecords = await firestore.collection(`tables/default/records`)
      .where('createdAt', '<', before)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
  return prevRecords.empty ? undefined : prevRecords.docs[0].data() as GameRecord;
}

function isConsecutivePlay(r1: GameRecord, r2: GameRecord) {
  r1.createdAt.getTime() > r2.createdAt.getTime() - 60 * 60 * 1000;
}

function updateRecentGames(recentGames: string, newGame: 'W'|'L', maxLength: number = 50): string {
  return (newGame + recentGames).substr(0, maxLength);
}

async function updateWinStats(ldap: string, teammate: string, opponents: string[], winStreaks: number) {
  const myStatsDoc = firestore.doc(`stats/${ldap}`);
  const myStats = (await myStatsDoc.get()).data() as PlayerStats || createNewPlayerStats();
  myStats.recentGames = updateRecentGames(myStats.recentGames, 'W');
  myStats.totalWins += 1;
  myStats.mostWinStreaks = Math.max(myStats.mostWinStreaks, winStreaks);

  const season = new Date().getFullYear().toString();
  const seasonStats = myStats.perSeason[season];
  if (seasonStats) {
    seasonStats.totalWins += 1;
  } else {
    myStats.perSeason[season] = {
      totalWins: 1,
      totalLoses: 0,
    };
  }

  const teammateStats = myStats.asTeammate[teammate];
  if (teammateStats) {
    teammateStats.recentGames = updateRecentGames(teammateStats.recentGames, 'W');
    teammateStats.totalWins += 1;
  } else {
    myStats.asTeammate[teammate] = {
      recentGames: 'W',
      totalWins: 1,
      totalLoses: 0,
    };
  }

  for (const opponent of opponents) {
    const opponentStats = myStats.asOpponent[teammate];
    if (opponentStats) {
      opponentStats.recentGames = updateRecentGames(opponentStats.recentGames, 'W');
      opponentStats.totalWins += 1;
    } else {
      myStats.asOpponent[opponent] = {
        recentGames: 'W',
        totalWins: 1,
        totalLoses: 0,
      };
    }
  }

  return myStatsDoc.set(myStats);
}

async function updateLoseStats(ldap: string, teammate: string, opponents: string[]) {
  const myStatsDoc = firestore.doc(`stats/${ldap}`);
  const myStats = (await myStatsDoc.get()).data() as PlayerStats || createNewPlayerStats();
  myStats.recentGames = updateRecentGames(myStats.recentGames, 'L');
  myStats.totalLoses += 1;

  const season = new Date().getFullYear().toString();
  const seasonStats = myStats.perSeason[season];
  if (seasonStats) {
    seasonStats.totalLoses += 1;
  } else {
    myStats.perSeason[season] = {
      totalWins: 0,
      totalLoses: 1,
    };
  }

  const teammateStats = myStats.asTeammate[teammate];
  if (teammateStats) {
    teammateStats.recentGames = updateRecentGames(teammateStats.recentGames, 'L');
    teammateStats.totalLoses += 1;
  } else {
    myStats.asTeammate[teammate] = {
      recentGames: 'L',
      totalWins: 0,
      totalLoses: 1,
    };
  }

  for (const opponent of opponents) {
    const opponentStats = myStats.asOpponent[teammate];
    if (opponentStats) {
      opponentStats.recentGames = updateRecentGames(opponentStats.recentGames, 'L');
      opponentStats.totalLoses += 1;
    } else {
      myStats.asOpponent[opponent] = {
        recentGames: 'L',
        totalWins: 0,
        totalLoses: 1,
      };
    }
  }

  return myStatsDoc.set(myStats);
}

async function getRecentGamesAfterLevelUpdate(
    player: Player, maxLength: number = 50): Promise<('W' | 'L')[]> {
  const collection = firestore.collection(`tables/default/records`);
  const { ldap, lastLevelUpdate } = player;
  let queries = [
    collection.where('winners', 'array-contains', ldap),
    collection.where('losers', 'array-contains', ldap)
  ];
  if (lastLevelUpdate) {
    queries = queries.map(q => q.where('createdAt', '>', lastLevelUpdate));
  }
  queries = queries.map(q => q.orderBy('createdAt', 'desc').limit(maxLength));
  const [winRecords, loseRecords] = await Promise.all(queries.map(q => q.get()));
  return winRecords.docs.map(snapshot => ['W', snapshot.data().createdAt])
      .concat(loseRecords.docs.map(snapshot => ['L', snapshot.data().createdAt]))
      .sort((a, b) =>  b[1].createdAt.getTime() - a[1].createdAt.getTime())
      .map(resultAndTime => resultAndTime[0])
      .slice(0, maxLength);
}

async function checkEvent(ldap: string) {
  const player = (await firestore.doc(`players/${ldap}`).get()).data() as Player;
  let numWins = 0;
  let numLoses = 0;
  for (const result of await getRecentGamesAfterLevelUpdate(player)) {
    numWins += (result === 'W' ? 1 : 0);
    numLoses += (result === 'L' ? 1 : 0);
    if (numWins + numLoses < 10) {
      continue;
    } else if (numWins > PROMO_THRESHOLD[numWins + numLoses]) {
      const now = new Date();
      return firestore.doc(`events/${now.getTime()}-${ldap}-promotion`)
          .set(createPromotionEvent(ldap, player.level, now));
    } else if (player.level > 1 && numLoses > PROMO_THRESHOLD[numWins + numLoses]) {
      const now = new Date();
      return firestore.doc(`events/${now.getTime()}-${ldap}-demotion`)
          .set(createDemotionEvent(ldap, player.level, now));
    }
  }
  return;
}
