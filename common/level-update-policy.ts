import { Arrays } from "./utils";

// Player cannot be promoted over MAX_LEVEL.
const MAX_LEVEL = 10;

// Player cannot be demoted below MIN_DEMOTE_LEVEL.
const MIN_DEMOTE_LEVEL = 1;

// Minimum number of games to play to be a candidate for promotion/demotion.
const MIN_GAMES = 10;

// Promotion thresholds generated from promo_threshold_gen.py.
// prettier-ignore
const PROMO_THRESHOLDS = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9,  9, 10, 11, 11, 12, 13, 13, 14, 15,
  15, 16, 17, 17, 18, 19, 19, 20, 20, 21,
  22, 22, 23, 24, 24, 25, 25, 26, 27, 27,
  28, 29, 29, 30, 30, 31, 32, 32, 33, 34,
  34, 35, 35, 36, 37, 37, 38, 38, 39, 40,
  40, 41, 41, 42, 43, 43, 44, 44, 45, 46,
  46, 47, 47, 48, 49, 49, 50, 51, 51, 52,
  52, 53, 54, 54, 55, 55, 56, 57, 57, 58,
  58, 59, 60, 60, 61, 61, 62, 62, 63, 64,
  64
];

export function checkLevelUpdate({
  recentGames,
  level
}: {
  recentGames: string;
  level: number;
}) {
  if (recentGames.length < MIN_GAMES) {
    return 0;
  }

  let wins = 0;
  let loses = 0;
  let total = 0;
  for (const result of recentGames) {
    wins += Number(result === "W");
    loses += Number(result === "L");
    total += 1;

    // Don't lookup more than our thresholds.
    if (total > PROMO_THRESHOLDS.length) {
      return 0;
    }

    if (total < MIN_GAMES) {
      continue;
    } else if (wins > PROMO_THRESHOLDS[total] && level < MAX_LEVEL) {
      return +1;
    } else if (loses > PROMO_THRESHOLDS[total] && level > MIN_DEMOTE_LEVEL) {
      return -1;
    }
  }

  // No promotion and demotion.
  return 0;
}

export function requiredWinsForPromo(recentGames: string, level: number) {
  for (const moreWins of Arrays.range(1, 4)) {
    if (
      checkLevelUpdate({
        recentGames: "W".repeat(moreWins) + recentGames,
        level
      }) > 0
    ) {
      return moreWins;
    }
  }
}

export function requiredLossesForDemo(recentGames: string, level: number) {
  for (const moreLosses of Arrays.range(1, 4)) {
    if (
      checkLevelUpdate({
        recentGames: "L".repeat(moreLosses) + recentGames,
        level
      }) < 0
    ) {
      return moreLosses;
    }
  }
}
