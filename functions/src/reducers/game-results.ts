import { DEFAULT_HISTORY_SIZE } from "../constant";

export function reduceGameResult(
  prevResults: string,
  newResult: "W" | "L" | "D",
  maxLength = DEFAULT_HISTORY_SIZE
) {
  return (newResult + prevResults).substring(0, maxLength);
}
