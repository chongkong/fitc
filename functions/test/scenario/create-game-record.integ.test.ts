import * as helper from "../helper";
import * as utils from "../utils";
import {
  GameRecord,
  PlayerStats,
  SeasonStats,
  RivalStats,
  TeamStats,
  Player
} from "../../../common/types";
import { sandbox } from "../../../common/platform/sandbox";
import { Path } from "../../../common/path";
import { Arrays } from "../../../common/utils";
import { PlayerState } from "../../src/internal-types";

beforeAll(async () => {
  await helper.clearFirestoreData();
});

afterAll(async () => {
  await helper.clearFirestoreData();
  await helper.cleanupTestApps();
});

describe("Creates GameRecord", () => {
  const app = helper.initializeTestApp();
  const db = new utils.TypedFirestoreWrapper(app.firestore());

  describe("On first game", () => {
    beforeAll(async () => {
      await helper.createDummyData();
      const now = sandbox.timestampFromDate("2019-11-11T12:34:56");
      await db.setDoc<GameRecord>(Path.gameRecord("default", now), {
        winners: ["jjong", "hdmoon"],
        losers: ["shinjiwon", "hyeonjilee"],
        isDraw: false,
        winStreaks: 1,
        createdAt: now,
        recordedBy: "jjong"
      });
      // Wait until function trigger finishes. Initiating first trigger takes time.
      await utils.sleep(2000);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test("jjong's PlayerStats changed", async () => {
      expect(await db.getDoc<PlayerStats>(Path.playerStats("jjong"))).toEqual({
        totalWins: 1,
        totalLoses: 0,
        mostWinStreaks: 1,
        recentGames: "W"
      });

      expect(
        await db.getDoc<SeasonStats>(Path.seasonStats("jjong", 2019))
      ).toEqual({
        totalWins: 1,
        totalLoses: 0
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("jjong", "hyeonjilee"))
      ).toEqual({
        totalWins: 1,
        totalLoses: 0,
        recentGames: "W"
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("jjong", "shinjiwon"))
      ).toEqual({
        totalWins: 1,
        totalLoses: 0,
        recentGames: "W"
      });
    });

    test("hdmoon's PlayerStats changed", async () => {
      expect(await db.getDoc<PlayerStats>(Path.playerStats("hdmoon"))).toEqual({
        totalWins: 1,
        totalLoses: 0,
        mostWinStreaks: 1,
        recentGames: "W"
      });

      expect(
        await db.getDoc<SeasonStats>(Path.seasonStats("hdmoon", 2019))
      ).toEqual({
        totalWins: 1,
        totalLoses: 0
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("hdmoon", "hyeonjilee"))
      ).toEqual({
        totalWins: 1,
        totalLoses: 0,
        recentGames: "W"
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("hdmoon", "shinjiwon"))
      ).toEqual({
        totalWins: 1,
        totalLoses: 0,
        recentGames: "W"
      });
    });

    test("shinjiwon's PlayerStats changed", async () => {
      expect(
        await db.getDoc<PlayerStats>(Path.playerStats("shinjiwon"))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1,
        mostWinStreaks: 0,
        recentGames: "L"
      });

      expect(
        await db.getDoc<SeasonStats>(Path.seasonStats("shinjiwon", 2019))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("shinjiwon", "jjong"))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1,
        recentGames: "L"
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("shinjiwon", "hdmoon"))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1,
        recentGames: "L"
      });
    });

    test("hyeonjilee's PlayerStats changed", async () => {
      expect(
        await db.getDoc<PlayerStats>(Path.playerStats("hyeonjilee"))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1,
        mostWinStreaks: 0,
        recentGames: "L"
      });

      expect(
        await db.getDoc<SeasonStats>(Path.seasonStats("hyeonjilee", 2019))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("hyeonjilee", "jjong"))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1,
        recentGames: "L"
      });

      expect(
        await db.getDoc<RivalStats>(Path.rivalStats("hyeonjilee", "hdmoon"))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1,
        recentGames: "L"
      });
    });

    test("hdmoon and jjong's TeamStats changed", async () => {
      expect(
        await db.getDoc<TeamStats>(Path.teamStats("jjong", "hdmoon"))
      ).toEqual({
        totalWins: 1,
        totalLoses: 0,
        mostWinStreaks: 1,
        recentGames: "W"
      });
    });

    test("hyeonjilee and shinjiwon's TeamStats changed", async () => {
      expect(
        await db.getDoc<TeamStats>(Path.teamStats("hyeonjilee", "shinjiwon"))
      ).toEqual({
        totalWins: 0,
        totalLoses: 1,
        mostWinStreaks: 0,
        recentGames: "L"
      });
    });
  });

  describe("On draw", () => {
    beforeAll(async () => {
      await helper.createDummyData();
      const now = sandbox.now();
      await db.setDoc<GameRecord>(Path.gameRecord("default", now), {
        winners: ["jjong", "hdmoon"],
        losers: ["shinjiwon", "hyeonjilee"],
        isDraw: true,
        winStreaks: 1,
        createdAt: now,
        recordedBy: "jjong"
      });
      await utils.sleep(500); // Wait until function trigger finishes.
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test("PlayerStats.recentGames updated", async () => {
      expect(
        await db.getDoc<PlayerStats>(Path.playerStats("jjong"))
      ).toMatchObject({
        recentGames: "D"
      });
      expect(
        await db.getDoc<PlayerStats>(Path.playerStats("hdmoon"))
      ).toMatchObject({
        recentGames: "D"
      });
      expect(
        await db.getDoc<PlayerStats>(Path.playerStats("shinjiwon"))
      ).toMatchObject({
        recentGames: "D"
      });
      expect(
        await db.getDoc<PlayerStats>(Path.playerStats("hyeonjilee"))
      ).toMatchObject({
        recentGames: "D"
      });
    });

    test("RivalStats.recentGames updated", async () => {
      const rivals = Arrays.cartesian(
        ["jjong", "hdmoon"],
        ["hyeonjilee", "shinjiwon"]
      );
      await Promise.all(
        rivals.flatMap(([a, b]) => [
          db.getDoc<RivalStats>(Path.rivalStats(a, b)).then(stats => {
            expect(stats).toMatchObject({ recentGames: "D" });
          }),
          db.getDoc<RivalStats>(Path.rivalStats(b, a)).then(stats => {
            expect(stats).toMatchObject({ recentGames: "D" });
          })
        ])
      );
    });

    test("TeamStats.recentGames updated", async () => {
      expect(
        await db.getDoc<TeamStats>(Path.teamStats("jjong", "hdmoon"))
      ).toMatchObject({ recentGames: "D" });
      expect(
        await db.getDoc<TeamStats>(Path.teamStats("shinjiwon", "hyeonjilee"))
      ).toMatchObject({ recentGames: "D" });
    });
  });

  describe("On 10 streaks", () => {
    beforeAll(async () => {
      await helper.createDummyData();
      for (let winStreaks = 1; winStreaks <= 10; winStreaks++) {
        const now = sandbox.now();
        db.setDoc<GameRecord>(Path.gameRecord("default", now), {
          winners: ["jjong", "hdmoon"],
          losers: ["shinjiwon", "hyeonjilee"],
          isDraw: false,
          winStreaks,
          createdAt: now,
          recordedBy: "jjong"
        });
        await utils.sleep(100);
      }
      // Wait until functions trigger.
      await utils.sleep(500);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test("Promotion and demotion events added", async () => {
      expect(await db.listDocs(Path.eventsCollection)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "promotion",
            ldap: "jjong"
          }),
          expect.objectContaining({
            type: "promotion",
            ldap: "hdmoon"
          }),
          expect.objectContaining({
            type: "demotion",
            ldap: "shinjiwon"
          }),
          expect.objectContaining({
            type: "demotion",
            ldap: "hyeonjilee"
          })
        ])
      );
    });

    test("Player levels have changed", async () => {
      expect(await db.listDocs<Player>(Path.playersCollection)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ldap: "jjong",
            level: 3
          }),
          expect.objectContaining({
            ldap: "hdmoon",
            level: 3
          }),
          expect.objectContaining({
            ldap: "shinjiwon",
            level: 1
          }),
          expect.objectContaining({
            ldap: "hyeonjilee",
            level: 2
          })
        ])
      );
    });

    test("PlayerState.recentGames are reset", async () => {
      const playerStates = await db.getDocs<PlayerState>(
        Path.playerState("jjong"),
        Path.playerState("hdmoon"),
        Path.playerState("shinjiwon"),
        Path.playerState("hyeonjilee")
      );

      for (const state of playerStates) {
        expect(state).toMatchObject({
          recentGames: ""
        });
      }
    });
  });
});
