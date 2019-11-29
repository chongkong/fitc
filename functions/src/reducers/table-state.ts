import { firestore } from "firebase-admin";

import { GameRecord } from "../../../common/types";
import { setEquals } from "../../../common/utils";
import { CONSECUTIVE_PLAY_THRESHOLD_MILLIS } from "../constant";
import { TableState } from "../internal-types";

function isConsecutivePlay(t1: firestore.Timestamp, t2: firestore.Timestamp) {
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
