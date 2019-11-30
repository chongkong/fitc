import * as helper from "../helper";
import * as utils from "../utils";
import {
  GameRecord,
  PlayerStats,
  SeasonStats,
  RivalStats,
  TeamStats,
  Player
} from "../../common/types";
import { sandbox } from "../../common/platform/sandbox";
import { Path } from "../../common/path";

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
      await utils.sleep(1000); // Wait until function trigger finishes.
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
      await utils.sleep(1000); // Wait until function trigger finishes.
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test("PlayerStats has updated recentGames", async () => {
      const allStats = await db.listDocs<PlayerStats>(
        Path.playerStatsCollection
      );
      allStats.forEach(stats => {
        expect(stats).toMatchObject({
          totalWins: 0,
          totalLoses: 0,
          recentGames: "D",
          mostWinStreaks: 0
        });
      });
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
        // Wait until functions trigger.
        await utils.sleep(100);
      }
      await utils.sleep(2000);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test("jjong got promoted", async () => {
      expect(await db.getDoc<Player>(Path.player("jjong"))).toMatchObject({
        level: 3
      });

      expect(await db.listDocs(Path.eventsCollection)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "promotion",
            ldap: "jjong"
          })
        ])
      );
    });

    test("hdmoon got promoted", async () => {
      expect(await db.getDoc<Player>(Path.player("hdmoon"))).toMatchObject({
        level: 3
      });

      expect(await db.listDocs(Path.eventsCollection)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "promotion",
            ldap: "hdmoon"
          })
        ])
      );
    });

    test("shinjiwon got demoted", async () => {
      expect(await db.getDoc<Player>(Path.player("shinjiwon"))).toMatchObject({
        level: 1
      });

      expect(await db.listDocs(Path.eventsCollection)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "demotion",
            ldap: "shinjiwon"
          })
        ])
      );
    });

    test("hyeonjilee got demoted", async () => {
      expect(await db.getDoc<Player>(Path.player("hyeonjilee"))).toMatchObject({
        level: 2
      });

      expect(await db.listDocs(Path.eventsCollection)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "demotion",
            ldap: "hyeonjilee"
          })
        ])
      );
    });
  });
});
