// Trigger on GameRecord document creation/modification.
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { GameRecord, Player, PlayerStats, TeamStats } from '../../../common/types';
import { setEquals } from '../../../common/utils';
import { firestore } from '../firebase';
import { PROMO_THRESHOLD } from '../data';
import { createNewPlayerStats, createPromotionEvent, createDemotionEvent, createNewTeamStats } from '../factory';


export const onGameRecordCreate = functions.firestore
    .document('tables/{tableId}/records/{recordId}')
    .onCreate((snapshot, context) => {
      const draft = snapshot.data() as GameRecord;

      // We currently don't have any further 
      if (draft.isDraw) {
        return;
      }

      // Container for all DB writing tasks
      const deferred: Promise<any>[] = [];

      const winStreaksPromise = context.authType === 'ADMIN' 
        ? Promise.resolve(draft.winStreaks)  // Admin should record correct winStreaks
        : getWinStreaks(draft, draft.createdAt);  // Cannot believe user's recording..

      if (context.authType !== 'ADMIN') {
        deferred.push(
          winStreaksPromise.then(winStreaks => 
            snapshot.ref.set({ ...draft, winStreaks }))
        )
      }

      const {winners, losers} = draft;
      const [w1, w2] = winners;
      const [l1, l2] = losers;

      if (context.authType !== 'ADMIN') {
        deferred.push(
          winStreaksPromise.then(winStreaks => 
            updateWinStats(w1, w2, losers, winStreaks)),
          winStreaksPromise.then(winStreaks => 
            updateWinStats(w2, w1, losers, winStreaks)),
          updateLoseStats(l1, l2, winners),
          updateLoseStats(l2, l1, winners),
          updateTeamStats(winners, true),
          updateTeamStats(losers, false),
        );
      }

      // Check promotion / demotion event. 
      if (context.authType !== 'ADMIN' && draft.recordedBy !== 'IMPORTER_V0') {
        deferred.push(
          checkEvent(w1),
          checkEvent(w2),
          checkEvent(l1),
          checkEvent(l2),
        );
      }

      return Promise.all(deferred)
        .catch(error => console.error(error));
    });

async function getWinStreaks(draft: GameRecord, createdAt: admin.firestore.Timestamp) {
  if (draft.isDraw) return 0;
  const prev = await getPreviousRecord(createdAt);
  if (prev && !prev.isDraw 
      && isConsecutivePlay(prev.createdAt, createdAt) 
      && setEquals(prev.winners, draft.winners)) {
    return prev.winStreaks + 1;
  } else {
    return 1;
  }
}

async function getPreviousRecord(before: admin.firestore.Timestamp) {
  const prevRecords = await firestore().collection(`tables/default/records`)
      .where('createdAt', '<', before)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
  return prevRecords.empty ? undefined : prevRecords.docs[0].data() as GameRecord;
}

function isConsecutivePlay(t1: admin.firestore.Timestamp, t2: admin.firestore.Timestamp) {
  return t1.toMillis() > t2.toMillis() - 60 * 60 * 1000;
}

function updateRecentGames(recentGames: string, newGame: 'W'|'L', maxLength: number = 50): string {
  return (newGame + recentGames).substr(0, maxLength);
}

async function updateTeamStats(team: string[], win: boolean) {
  const stats = await firestore().doc(`teamStats/${team.sort().join(',')}`).get();
  const newStats = stats.exists ? stats.data() as TeamStats : createNewTeamStats();
  newStats.recentGames = updateRecentGames(newStats.recentGames, win ? 'W' : 'L');
  newStats.totalWins += win ? 1 : 0;
  newStats.totalLoses += win ? 0 : 1;
  return stats.ref.set(newStats);
}

async function updateWinStats(ldap: string, teammate: string, opponents: string[], winStreaks: number = 0) {
  const myStatsSnapshot = await firestore().doc(`playerStats/${ldap}`).get();
  const myStats = myStatsSnapshot.exists
    ? myStatsSnapshot.data() as PlayerStats
    : createNewPlayerStats();
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

  return myStatsSnapshot.ref.set(myStats);
}

async function updateLoseStats(ldap: string, teammate: string, opponents: string[]) {
  const myStatsSnapshot = await firestore().doc(`playerStats/${ldap}`).get();
  const myStats = myStatsSnapshot.exists
    ? myStatsSnapshot.data() as PlayerStats
    : createNewPlayerStats();
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

  return myStatsSnapshot.ref.set(myStats);
}

async function getRecentGamesAfterLevelUpdate(player: Player, maxLength: number = 50): Promise<('W' | 'L')[]> {
  const { ldap, lastLevelUpdate } = player;
  const collection = firestore().collection(`tables/default/records`);
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
      .sort((a, b) => b[1].toMillis() - a[1].toMillis())
      .map(resultAndTime => resultAndTime[0])
      .slice(0, maxLength);
}

async function checkEvent(ldap: string) {
  const playerSnapshot = await firestore().doc(`players/${ldap}`).get();
  const player = playerSnapshot.data() as Player;
  let numWins = 0;
  let numLoses = 0;
  const recentGames = await getRecentGamesAfterLevelUpdate(player);
  for (const result of recentGames) {
    numWins += (result === 'W' ? 1 : 0);
    numLoses += (result === 'L' ? 1 : 0);
    if (numWins + numLoses < 10) {
      continue;
    } else if (numWins > PROMO_THRESHOLD[numWins + numLoses]) {
      const now = admin.firestore.Timestamp.now();
      return firestore().doc(`events/${now.toMillis()}-${ldap}-promotion`)
          .set(createPromotionEvent(ldap, player.level, now));
    } else if (player.level > 1 && numLoses > PROMO_THRESHOLD[numWins + numLoses]) {
      const now = admin.firestore.Timestamp.now();
      return firestore().doc(`events/${now.toMillis()}-${ldap}-demotion`)
          .set(createDemotionEvent(ldap, player.level, now));
    }
  }
  return;
}
