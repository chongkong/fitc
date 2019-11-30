import { reduceGameResult } from "./game-results";
import { PlayerState } from "../internal-types";

export const reducePlayerState = (
  state: PlayerState,
  {
    result,
    promoted,
    demoted
  }: { result?: "W" | "L" | "D"; promoted?: boolean; demoted?: boolean }
): PlayerState => {
  if (result) {
    return {
      recentGames: reduceGameResult(state.recentGames, result)
    };
  } else if (promoted || demoted) {
    return { recentGames: "" };
  } else {
    return { recentGames: state.recentGames };
  }
};
