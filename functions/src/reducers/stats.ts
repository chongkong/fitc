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
  totalWins: Number(result === "W") + playerStats.totalWins,
  totalLoses: Number(result === "L") + playerStats.totalLoses,
  mostWinStreaks: Math.max(winStreaks, playerStats.mostWinStreaks),
  recentGames: reduceGameResult(playerStats.recentGames, result)
});

export const reduceRivalStats = (
  rivalStats: RivalStats,
  { result }: { result: "W" | "L" | "D" }
): RivalStats => ({
  totalWins: Number(result === "W") + rivalStats.totalWins,
  totalLoses: Number(result === "L") + rivalStats.totalLoses,
  recentGames: reduceGameResult(rivalStats.recentGames, result)
});

export const reduceSeasonStats = (
  seasonStats: SeasonStats,
  { result }: { result: "W" | "L" | "D" }
): SeasonStats => ({
  totalWins: Number(result === "W") + seasonStats.totalWins,
  totalLoses: Number(result === "L") + seasonStats.totalLoses
});

export const reduceTeamStats = (
  teamStats: TeamStats,
  { result, winStreaks }: { result: "W" | "L" | "D"; winStreaks: number }
): TeamStats => ({
  totalWins: Number(result === "W") + teamStats.totalWins,
  totalLoses: Number(result === "L") + teamStats.totalLoses,
  mostWinStreaks: Math.max(winStreaks, teamStats.mostWinStreaks),
  recentGames: reduceGameResult(teamStats.recentGames, result)
});
