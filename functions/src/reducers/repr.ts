import { GameRecord } from "../../../common/types";
import { DEFAULT_HISTORY_SIZE } from "../constant";

export type GameResultSymbol = 'W'|'L'|'D';

export function toSymbol(record: GameRecord, me: string): GameResultSymbol|undefined {
  return record.isTie ? 'D'
    : record.winners.includes(me) ? 'W'
    : record.losers.includes(me) ? 'L'
    : undefined;
}

export function updateResults(
  results: string,
  newResult: GameResultSymbol,
  maxLength = DEFAULT_HISTORY_SIZE
) {
  return (newResult + results).substring(0, maxLength);
}
