import { GameRecord } from "../../../common/types";
import { setEquals } from "../../../common/utils";
import { Timestamp } from "../../../common/platform/base";
import { CONSECUTIVE_PLAY_THRESHOLD_MILLIS } from "../constant";
import { TableState } from "../../../common/types";

function isConsecutivePlay(t1: Timestamp, t2: Timestamp) {
  return t2.toMillis() - t1.toMillis() < CONSECUTIVE_PLAY_THRESHOLD_MILLIS;
}

export function reduceTableState(
  state: TableState,
  input: GameRecord
): Required<TableState> {
  let winStreaks = input.isDraw ? 0 : 1;
  if (
    state.lastRecord &&
    !state.lastRecord.isDraw &&
    isConsecutivePlay(state.lastRecord.createdAt, input.createdAt) &&
    setEquals(state.lastRecord.winners, input.winners)
  ) {
    winStreaks = state.lastRecord.winStreaks + 1;
  }
  return {
    lastRecord: Object.assign({}, input, { winStreaks })
  };
}
