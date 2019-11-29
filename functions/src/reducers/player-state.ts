import { reduceGameResult } from "./game-results";
import { PlayerState } from "../internal-types";

export const reducePlayerState = (
  state: PlayerState,
  { result }: { result: "W" | "L" | "D" }
): PlayerState => ({
  recentGames: reduceGameResult(state.recentGames, result)
});
