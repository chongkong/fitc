import { Platform } from "./platform/base";
import {
  Player,
  GameRecord,
  FoosballTable,
  PlayerStats,
  SeasonStats,
  RivalStats,
  TeamStats,
  PromotionEvent,
  DemotionEvent,
  PlayerState,
  TableState
} from "./types";
import { RequirePartial } from "./utils";

export class Factory {
  constructor(private platform: Platform) {}

  createPlayer = ({
    name,
    ldap,
    level = 1,
    createdAt
  }: RequirePartial<Player, "ldap" | "name">): Player => ({
    name,
    ldap,
    level,
    createdAt: createdAt || this.platform.now()
  });

  createGameRecord = ({
    winners,
    losers,
    isDraw = false,
    winStreaks = 0,
    createdAt,
    recordedBy
  }: RequirePartial<
    GameRecord,
    "winners" | "losers" | "recordedBy"
  >): GameRecord => ({
    winners,
    losers,
    isDraw,
    winStreaks,
    createdAt: createdAt || this.platform.now(),
    recordedBy
  });

  createTable = ({
    name,
    bench
  }: RequirePartial<FoosballTable, "name">): FoosballTable => ({
    name,
    bench: bench || []
  });

  emptyPlayerStats = (): PlayerStats => ({
    totalWins: 0,
    totalLoses: 0,
    mostWinStreaks: 0,
    recentGames: ""
  });

  emptySeasonStats = (): SeasonStats => ({
    totalWins: 0,
    totalLoses: 0
  });

  emptyRivalStats = (): RivalStats => ({
    totalWins: 0,
    totalLoses: 0,
    recentGames: ""
  });

  emptyTeamStats = (): TeamStats => ({
    totalWins: 0,
    totalLoses: 0,
    mostWinStreaks: 0,
    recentGames: ""
  });

  createPromotionEvent = ({
    ldap,
    levelFrom,
    levelTo
  }: RequirePartial<PromotionEvent, "ldap" | "levelFrom">) => ({
    type: "promotion",
    ldap,
    levelFrom,
    levelTo: levelTo || levelFrom + 1,
    createdAt: this.platform.now()
  });

  createDemotionEvent = ({
    ldap,
    levelFrom,
    levelTo
  }: RequirePartial<DemotionEvent, "ldap" | "levelFrom">) => ({
    type: "demotion",
    ldap,
    levelFrom,
    levelTo: levelTo || levelFrom - 1,
    createdAt: this.platform.now()
  });

  initialPlayerState = (): PlayerState => ({
    recentGames: ""
  });

  initialTableState = (): TableState => ({});
}
