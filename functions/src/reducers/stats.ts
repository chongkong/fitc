import {
  PlayerStats,
  OpponentStats,
  SeasonStats,
  TeamStats
} from "../../../common/types";
import { reduceGameResult } from "./repr";

export const reducePlayerStats = (
  playerStats: PlayerStats,
  { result, winStreaks }: { result: "W" | "L" | "D"; winStreaks: number }
): PlayerStats => ({
  totalWins: Number(result === "W") + playerStats.totalWins,
  totalLoses: Number(result === "L") + playerStats.totalLoses,
  mostWinStreaks: Math.max(winStreaks, playerStats.mostWinStreaks),
  recentGames: reduceGameResult(playerStats.recentGames, result)
});

export const reduceOpponentStats = (
  opponentStats: OpponentStats,
  { result }: { result: "W" | "L" | "D" }
): OpponentStats => ({
  totalWins: Number(result === "W") + opponentStats.totalWins,
  totalLoses: Number(result === "L") + opponentStats.totalLoses,
  recentGames: reduceGameResult(opponentStats.recentGames, result)
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
