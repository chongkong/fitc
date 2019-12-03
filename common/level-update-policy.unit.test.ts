import { checkLevelUpdate } from "./level-update-policy";
import { Arrays } from "./utils";

describe("checkLevelUpdate", () => {
  test("Does not get demoted below 1", () => {
    expect(
      checkLevelUpdate({
        recentGames: "L".repeat(50),
        level: 1
      })
    ).toBe(0);
  });

  test("Does not get promoted above 10", () => {
    expect(
      checkLevelUpdate({
        recentGames: "W".repeat(50),
        level: 10
      })
    ).toBe(0);
  });

  test("No update if games played < 10", () => {
    expect(
      checkLevelUpdate({
        recentGames: "W".repeat(9),
        level: 5
      })
    ).toBe(0);

    expect(
      checkLevelUpdate({
        recentGames: "L".repeat(9),
        level: 5
      })
    ).toBe(0);
  });

  test.each([
    [12, 15],
    [15, 20]
  ])("Promoted if more than %d games out of %d win", (wins, total) => {
    Arrays.range(wins, total + 1).forEach(wins => {
      expect(
        checkLevelUpdate({
          recentGames: "W".repeat(wins) + "L".repeat(total - wins),
          level: 5
        })
      ).toBe(+1);
    });
  });

  test.each([
    [12, 15],
    [15, 20]
  ])("Demoted if more than %d games out of %d lost", (loses, total) => {
    Arrays.range(loses, total + 1).forEach(loses => {
      expect(
        checkLevelUpdate({
          recentGames: "L".repeat(loses) + "W".repeat(total - loses),
          level: 5
        })
      ).toBe(-1);
    });
  });
});
