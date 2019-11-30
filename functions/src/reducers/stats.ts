import {
  PlayerStats,
  RivalStats,
  SeasonStats,
  TeamStats
} from "../../../common/types";
import { reduceGameResult } from "./game-results";

export const reducePlayerStats = (
  playerStats: PlayerStats,
  { result, winStreaks }: { result: "W" | "L" | "D"; winStreaks: number }
): PlayerStats => ({
  totalWins: (result === "W" ? 1 : 0) + playerStats.totalWins,
  totalLoses: (result === "L" ? 1 : 0) + playerStats.totalLoses,
  mostWinStreaks:
    result === "W"
      ? Math.max(winStreaks, playerStats.mostWinStreaks)
      : playerStats.mostWinStreaks,
  recentGames: reduceGameResult(playerStats.recentGames, result)
});

export const reduceRivalStats = (
  rivalStats: RivalStats,
  { result }: { result: "W" | "L" | "D" }
): RivalStats => ({
  totalWins: (result === "W" ? 1 : 0) + rivalStats.totalWins,
  totalLoses: (result === "L" ? 1 : 0) + rivalStats.totalLoses,
  recentGames: reduceGameResult(rivalStats.recentGames, result)
});

export const reduceSeasonStats = (
  seasonStats: SeasonStats,
  { result }: { result: "W" | "L" | "D" }
): SeasonStats => ({
  totalWins: (result === "W" ? 1 : 0) + seasonStats.totalWins,
  totalLoses: (result === "L" ? 1 : 0) + seasonStats.totalLoses
});

export const reduceTeamStats = (
  teamStats: TeamStats,
  { result, winStreaks }: { result: "W" | "L" | "D"; winStreaks: number }
): TeamStats => ({
  totalWins: (result === "W" ? 1 : 0) + teamStats.totalWins,
  totalLoses: (result === "L" ? 1 : 0) + teamStats.totalLoses,
  mostWinStreaks:
    result === "W"
      ? Math.max(winStreaks, teamStats.mostWinStreaks)
      : teamStats.mostWinStreaks,
  recentGames: reduceGameResult(teamStats.recentGames, result)
});
