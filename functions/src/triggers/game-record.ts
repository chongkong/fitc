// Trigger on GameRecord document creation/modification.

import * as functions from 'firebase-functions';

import { GameRecord, Player, PlayerStats, Event } from 'common/types';
import { firestore } from 'functions/src/admin';
import { PROMO_THRESHOLD } from 'functions/src/data';


function updateRecentGames(recentGames: string, newGame: string, maxLength?: number = 50): string {
  return (newGame + recentGames).substr(0, maxLength);
}

async function recordWinStats(ldap: string, teammate: string, opponents: string[], winStreaks: number) {
  const myStatsDoc = firestore.doc(`stats/${ldap}`);
  const myStats = (await myStatsDoc.get()).data() as PlayerStats;
  myStats.recentGames = updateRecentGames(myStats.recentGames, 'W');
  myStats.totalWins += 1;
  myStats.mostWinStreaks = Math.max(myStats.mostWinStreaks, winStreaks);

  let season = new Date().getFullYear();
  let seasonStats = myStats.perSeason[season];
  if (seasonStats) {
    seasonStats.totalWins += 1;
  } else {
    myStats.perSeason[season] = {
      totalWins: 1,
      totalLoses: 0,
    };
  }

  let teammateStats = myStats.asTeammate[teammate];
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
    let opponentStats = myStats.asOpponent[teammate];
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

  return await myStatsDoc.set(myStats);
}

async function recordLoseStats(ldap: string, teammate: string, opponents: string[]) {
  const myStatsDoc = firestore.doc(`stats/${ldap}`);
  const myStats = (await myStatsDoc.get()).data() as PlayerStats;
  myStats.recentGames = updateRecentGames(myStats.recentGames, 'L');
  myStats.totalLoses += 1;

  let season = new Date().getFullYear();
  let seasonStats = myStats.perSeason[season];
  if (seasonStats) {
    seasonStats.totalLoses += 1;
  } else {
    myStats.perSeason[season] = {
      totalWins: 0,
      totalLoses: 1,
    };
  }

  let teammateStats = myStats.asTeammate[teammate];
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
    let opponentStats = myStats.asOpponent[teammate];
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

  return await myStatsDoc.set(myStats);
}

async function getRecentGamesAfterLevelUpdate(
    ldap: string, after?: Date, maxLength?: number = 50): Promise<('W' | 'L')[]> {
  const collection = firestore.collection(`tables/default/records`);
  let queries = [
    collection.where('winners', 'array-contains', ldap),
    collection.where('losers', 'array-contains', ldap)
  ];
  if (after) {
    queries = queries.map(q => q.where('createdAt', '>', after));
  }
  queries = queries.map(q => q.orderBy('createdAt', 'desc').limit(maxLength));
  const [winRecords, loseRecords] = await Promise.all(queries.map(q => q.get()));
  return winRecords.docs.map(snapshot => ['W', snapshot.data().createdAt])
      .concat(loseRecords.docs.map(snapshot => ['L', snapshot.data().createdAt]))
      .sort((a, b) =>  b[1].createdAt.getTime() - a[1].createdAt.getTime())
      .map(resultAndTime => resultAndTime[0])
      .slice(0, maxLength);
}

function promotionEvent(ldap: string, levelFrom: number, createdAt: Date): Event {
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

function demotionEvent(ldap: string, levelFrom: number, createdAt: Date): Event {
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

async function checkEvent(ldap: string) {
  const player = (await firestore.doc(`players/${ldap}`).get()).data() as Player;
  let numWins = 0;
  let numLoses = 0;
  for (let result of await getRecentGamesAfterLevelUpdate(ldap, player.lastLevelUpdate)) {
    numWins += (result === 'W' ? 1 : 0);
    numLoses += (result === 'L' ? 1 : 0);
    if (numWins + numLoses < 10)
      continue;
    if (numWins > PROMO_THRESHOLD[numWins + numLoses]) {
      const now = new Date();
      await firestore.doc(`events/${now.getTime()}-${ldap}-promotion`)
          .set(promotionEvent(ldap, player.level, now));
      return;
    } else if (player.level > 1 && numLoses > PROMO_THRESHOLD[numWins + numLoses]) {
      const now = new Date();
      await firestore.doc(`events/${now.getTime()}-${ldap}-demotion`)
          .set(demotionEvent(ldap, player.level, now));
      return;
    }
  }
}

export const onGameRecordCreate = functions.firestore
    .document('tables/{tableId}/records/{recordId}')
    .onCreate((snapshot) => {
      let record = snapshot.data() as GameRecord;
      if (record.isTie) {
        return;
      }

      let promisesToWait = [];

      const winners = record.winners.map(snapshot => snapshot.playerId);
      const losers = record.losers.map(snapshot => snapshot.playerId);
      const [w1, w2] = winners;
      const [l1, l2] = losers;

      promisesToWait.push(
        recordWinStats(w1, w2, losers, record.winStreaks),
        recordWinStats(w2, w1, losers, record.winStreaks),
        recordLoseStats(l1, l2, winners),
        recordLoseStats(l2, l1, winners),
      );

      if (!record.preventEvent) {
        promisesToWait.push(
          checkEvent(w1),
          checkEvent(w2),
          checkEvent(w1),
          checkEvent(w2),
        );
      }
      
      return Promise.all(promisesToWait);
    });
