import * as admin from 'firebase-admin';
import { helper } from '../helper';
import { sleep } from '../utils';


afterAll(async () => {
  await helper.clearFirestoreData();
});

describe('Creates GameRecord', () => {
  describe('On first game', () => {
    beforeAll(async () => {
      await helper.createDummyData();
      const now = admin.firestore.Timestamp.fromDate(new Date('2019-11-11T12:34:56'));
      await helper.firestore().doc(`tables/default/records/${now.toMillis()}`).set({
        winners: ['jjong', 'hdmoon'],
        losers: ['shinjiwon', 'hyeonjilee'],
        isTie: false,
        winStreaks: 1,
        createdAt: now,
        recordedBy: 'jjong'
      });
      await sleep(1000);  // Wait until function trigger finishes.
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test("jjong's PlayerStats created", async () => {
      const stats = await helper.firestore().doc('stats/jjong').get();
      expect(stats.exists);
      expect(stats.data()).toMatchObject({
        totalWins: 1,
        totalLoses: 0,
        mostWinStreaks: 1,
        recentGames: 'W',
        perSeason: {
          '2019': {
            totalWins: 1,
            totalLoses: 0,
          }
        },
        asTeammate: {
          'hdmoon': {
            totalWins: 1,
            totalLoses: 0,
            recentGames: 'W',
          }
        },
        asOpponent: {
          'shinjiwon': {
            totalWins: 1,
            totalLoses: 0,
            recentGames: 'W',
          },
          'hyeonjilee': {
            totalWins: 1,
            totalLoses: 0,
            recentGames: 'W',
          },
        }
      });
    });

    test("hdmoon's PlayerStats created", async () => {
      const stats = await helper.firestore().doc('stats/hdmoon').get();
      expect(stats.data()).toMatchObject({
        totalWins: 1,
        totalLoses: 0,
        mostWinStreaks: 1,
        recentGames: 'W',
        perSeason: {
          '2019': {
            totalWins: 1,
            totalLoses: 0,
          }
        },
        asTeammate: {
          'jjong': {
            totalWins: 1,
            totalLoses: 0,
            recentGames: 'W',
          }
        },
        asOpponent: {
          'shinjiwon': {
            totalWins: 1,
            totalLoses: 0,
            recentGames: 'W',
          },
          'hyeonjilee': {
            totalWins: 1,
            totalLoses: 0,
            recentGames: 'W',
          },
        }
      });
    });

    test("shinjiwon's PlayerStats created", async () => {
      const stats = await helper.firestore().doc('stats/shinjiwon').get();
      expect(stats.data()).toMatchObject({
        totalWins: 0,
        totalLoses: 1,
        mostWinStreaks: 0,
        recentGames: 'L',
        perSeason: {
          '2019': {
            totalWins: 0,
            totalLoses: 1,
          }
        },
        asTeammate: {
          'hyeonjilee': {
            totalWins: 0,
            totalLoses: 1,
            recentGames: 'L',
          }
        },
        asOpponent: {
          'jjong': {
            totalWins: 0,
            totalLoses: 1,
            recentGames: 'L',
          },
          'hdmoon': {
            totalWins: 0,
            totalLoses: 1,
            recentGames: 'L',
          },
        }
      });
    });

    test("hyeonjilee's PlayerStats created", async () => {
      const stats = await helper.firestore().doc('stats/hyeonjilee').get();
      expect(stats.data()).toMatchObject({
        totalWins: 0,
        totalLoses: 1,
        mostWinStreaks: 0,
        recentGames: 'L',
        perSeason: {
          '2019': {
            totalWins: 0,
            totalLoses: 1,
          }
        },
        asTeammate: {
          'shinjiwon': {
            totalWins: 0,
            totalLoses: 1,
            recentGames: 'L',
          }
        },
        asOpponent: {
          'jjong': {
            totalWins: 0,
            totalLoses: 1,
            recentGames: 'L',
          },
          'hdmoon': {
            totalWins: 0,
            totalLoses: 1,
            recentGames: 'L',
          },
        }
      });
    });
  });
});
