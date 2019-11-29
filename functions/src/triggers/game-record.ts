// Trigger on GameRecord document creation/modification.
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { GameRecord, Player, PlayerStats, Triggerable, Event } from '../../../common/types';
import { setEquals } from '../../../common/utils';
import { app } from '../firebase';
import { PROMO_THRESHOLD } from '../data';
import { createNewPlayerStats, createPromotionEvent, createDemotionEvent } from '../factory';

export const onGameRecordCreate = functions.firestore
    .document('tables/default/records/{recordId}')
    .onCreate(snapshot => {
      const draft = snapshot.data() as (GameRecord & Triggerable);
      const deferred: Promise<any>[] = [];

      if (draft.__preventTrigger || draft.isTie) {
        return;
      }

      const winStreaksPromise = getWinStreaks(draft, draft.createdAt);

      deferred.push(
        winStreaksPromise.then(winStreaks => 
          snapshot.ref.set({ ...draft, winStreaks }))
      )

      const {winners, losers} = draft;
      const [w1, w2] = winners;
      const [l1, l2] = losers;

      deferred.push(
        winStreaksPromise.then(winStreaks => 
          updateWinStats(w1, w2, losers, winStreaks)),
        winStreaksPromise.then(winStreaks => 
          updateWinStats(w2, w1, losers, winStreaks)),
        updateLoseStats(l1, l2, winners),
        updateLoseStats(l2, l1, winners),
      );

      // Check promotion / demotion event
      if (!draft.__preventEvent) {
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
  if (draft.isTie) return 0;
  const prev = await getPreviousRecord(createdAt);
  if (prev && !prev.isTie 
      && isConsecutivePlay(prev.createdAt, createdAt) 
      && setEquals(prev.winners, draft.winners)) {
    return prev.winStreaks + 1;
  } else {
    return 1;
  }
}

async function getPreviousRecord(before: admin.firestore.Timestamp) {
  const prevRecords = await app.firestore().collection(`tables/default/records`)
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

async function updateWinStats(ldap: string, teammate: string, opponents: string[], winStreaks: number = 0) {
  const myStatsSnapshot = await app.firestore().doc(`stats/${ldap}`).get();
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
  const myStatsSnapshot = await app.firestore().doc(`stats/${ldap}`).get();
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
  const collection = app.firestore().collection(`tables/default/records`);
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
  const playerSnapshot = await app.firestore().doc(`players/${ldap}`).get();
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
      return app.firestore().doc(`events/${now.toMillis()}-${ldap}`)
          .set(createPromotionEvent(ldap, player.level, now));
    } else if (player.level > 1 && numLoses > PROMO_THRESHOLD[numWins + numLoses]) {
      const now = admin.firestore.Timestamp.now();
      return app.firestore().doc(`events/${now.toMillis()}-${ldap}`)
          .set(createDemotionEvent(ldap, player.level, now));
    }
  }
  return;
}

export const onGameRecordDelete = functions.firestore
    .document('tables/default/records/{recordId}')
    .onDelete(snapshot => {
      const removed = snapshot.data() as (GameRecord & Triggerable);
      const deferred: Promise<any>[] = [];
      const allPlayers = removed.winners.concat(removed.losers);
      deferred.push(
        ...allPlayers.map(ldap => cancelLatestFromPlayerStats(ldap, removed)),
        ...allPlayers.map(ldap => cancelEventIfAny(ldap, removed.createdAt))
      );
      return Promise.all(deferred);
    });

async function cancelLatestFromPlayerStats(ldap : string, gameRecord: GameRecord){
  const statsSnapshot = await app.firestore().doc(`stats/${ldap}`).get();
  if (statsSnapshot.data() === undefined) {
    return Promise.resolve(); 
  }
  const stats = statsSnapshot.data() as PlayerStats;

  const lastGameResult = stats.recentGames.charAt(0);
  stats.recentGames = stats.recentGames.substring(1);
  if (lastGameResult === 'W') {
    stats.totalWins -= 1;
    stats.perSeason[gameRecord.createdAt.toDate().getFullYear()].totalWins -= 1;
    gameRecord.losers.forEach(loser => {
      stats.asOpponent[loser].totalWins -= 1;
      stats.asOpponent[loser].recentGames = stats.asOpponent[loser].recentGames.substring(1);
    })
    gameRecord.winners.filter(winner => winner !== ldap).forEach(teammate => {
      stats.asTeammate[teammate].totalWins -= 1;
      stats.asTeammate[teammate].recentGames = stats.asTeammate[teammate].recentGames.substring(1);
    })
  } else {
    stats.totalLoses -= 1;
    stats.perSeason[gameRecord.createdAt.toDate().getFullYear()].totalLoses -= 1;
    gameRecord.winners.forEach(winner => {
      stats.asOpponent[winner].totalLoses -= 1;
      stats.asOpponent[winner].recentGames = stats.asOpponent[winner].recentGames.substring(1);
    })
    gameRecord.losers.filter(loser => loser !== ldap).forEach(teammate => {
      stats.asTeammate[teammate].totalLoses -= 1;
      stats.asTeammate[teammate].recentGames = stats.asTeammate[teammate].recentGames.substring(1);
    })
  }

  return statsSnapshot.ref.set(stats);
}

async function cancelEventIfAny(ldap: string, after: admin.firestore.Timestamp) {
  const events = await app.firestore()
    .collection('events')
    .where('createdAt', '>=', after)
    .where('payload.ldap', '==', ldap)
    .get();
  
  return events.docs.map(eventSnap => {
    const event = eventSnap.data() as Event;
    if (event.type === 'promotion' || event.type === 'demotion'){
      return eventSnap.ref.delete();
    }
    return Promise.resolve();
  })
}