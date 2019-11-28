import { Timestamp } from '@google-cloud/firestore';

import { Player } from '../../common/types';
import { DEFAULT_HISTORY_SIZE } from './constant';
import { listPlayerRecentGamesAsSymbol } from './dao';
import { createPromotionEvent, createDemotionEvent } from './factory';

// Promotion qualification is analyzed from recent PROMO_WINDOW_SIZE games.
const PROMO_WINDOW_SIZE = DEFAULT_HISTORY_SIZE;

// Player cannot be promoted over MAX_LEVEL.
const MAX_LEVEL = 10;

// Player cannot be demoted below MIN_DEMOTE_LEVEL.
const MIN_DEMOTE_LEVEL = 1;

// Minimum number of games to play to be a candidate for promotion/demotion.
const MIN_GAMES = 10;

// Promotion thresholds generated from promo_threshold_gen.py.
const PROMO_THRESHOLDS = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9,  9, 10, 11, 11, 12, 13, 13, 14, 15,
  15, 16, 17, 17, 18, 19, 19, 20, 20, 21,
  22, 22, 23, 24, 24, 25, 25, 26, 27, 27,
  28, 29, 29, 30, 30, 31, 32, 32, 33, 34,
  34
];

export async function checkLevelUpdate(player: Player) {
  const recentGames = await listPlayerRecentGamesAsSymbol(
    player.ldap, player.lastLevelUpdate, PROMO_WINDOW_SIZE);
  if (recentGames.length < MIN_GAMES) {
    return;
  }

  let numWins = 0;
  let numLoses = 0;
  let numGames = 0;
  for (const result of recentGames) {
    numWins += (result === 'W' ? 1 : 0);
    numLoses += (result === 'L' ? 1 : 0);
    numGames += 1;

    if (numGames < MIN_GAMES) {
      continue;
    } else if (numWins > PROMO_THRESHOLDS[numGames] && player.level < MAX_LEVEL) {
      return createPromotionEvent(player.ldap, player.level, Timestamp.now());
    } else if (numLoses > PROMO_THRESHOLDS[numGames] && player.level > MIN_DEMOTE_LEVEL) {
      return createDemotionEvent(player.ldap, player.level, Timestamp.now());
    }
  }

  // No promotion and demotion.
  return;
}
