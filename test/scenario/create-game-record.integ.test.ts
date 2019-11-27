import { Timestamp } from '@google-cloud/firestore';
import { helper } from '../helper';
import { sleep } from '../utils';


afterAll(async () => {
  await helper.clearFirestoreData();
});

describe('Creates GameRecord', () => {
  describe('On first game', () => {
    beforeAll(async () => {
      await helper.createDummyData();
      const now = Timestamp.fromDate(new Date('2019-11-11T12:34:56'));
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

    test("jjong's PlayerStats changed", async () => {
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

    test("hdmoon's PlayerStats changed", async () => {
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

    test("shinjiwon's PlayerStats changed", async () => {
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

    test("hyeonjilee's PlayerStats changed", async () => {
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

  describe('On draw', () => {
    beforeAll(async () => {
      await helper.createDummyData();
      const now = Timestamp.now();
      await helper.firestore().doc(`tables/default/records/${now.toMillis()}`).set({
        winners: ['jjong', 'hdmoon'],
        losers: ['shinjiwon', 'hyeonjilee'],
        isTie: true,
        winStreaks: 1,
        createdAt: now,
        recordedBy: 'jjong'
      });
      await sleep(1000);  // Wait until function trigger finishes.
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test('No PlayerStats changed', async () => {
      const allStats = await helper.firestore().collection('stats').get();
      allStats.docs.forEach(doc => {
        expect(doc.data()).toMatchObject({
          totalWins: 0,
          totalLoses: 0,
          recentGames: '',
          mostWinStreaks: 0,
        });
      });
    });
  });

  describe('On 10 streaks', () => {
    beforeAll(async () => {
      await helper.createDummyData();
      for (let winStreaks = 1; winStreaks <= 10; winStreaks++) {
        const now = Timestamp.now();
        await helper.firestore().doc(`tables/default/records/${now.toMillis()}`).create({
          winners: ['jjong', 'hdmoon'],
          losers: ['shinjiwon', 'hyeonjilee'],
          isTie: false,
          winStreaks,
          createdAt: now,
          recordedBy: 'jjong'
        });
        // Wait until functions trigger.
        await sleep(100);
      }
      await sleep(2000);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    });

    test('jjong got promoted', async () => {
      const player = await helper.firestore().doc('players/jjong').get();
      expect(player.data()).toMatchObject({
        level: 3
      });
      
      const events = await helper.firestore().collection('events').get();
      expect(events.docs.map(doc => doc.data())).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'promotion',
            payload: {
              ldap: 'jjong',
              levelFrom: 2,
              levelTo: 3
            }
          })
        ])
      );
    });

    test('hdmoon got promoted', async () => {
      const player = await helper.firestore().doc('players/hdmoon').get();
      expect(player.data()).toMatchObject({
        level: 3
      });
      
      const events = await helper.firestore().collection('events').get();
      expect(events.docs.map(doc => doc.data())).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'promotion',
            payload: {
              ldap: 'hdmoon',
              levelFrom: 2,
              levelTo: 3
            }
          })
        ])
      );
    });

    test('shinjiwon got demoted', async () => {
      const player = await helper.firestore().doc('players/shinjiwon').get();
      expect(player.data()).toMatchObject({
        level: 1
      });
      
      const events = await helper.firestore().collection('events').get();
      expect(events.docs.map(doc => doc.data())).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'demotion',
            payload: {
              ldap: 'shinjiwon',
              levelFrom: 2,
              levelTo: 1
            }
          })
        ])
      );
    });

    test('hyeonjilee got demoted', async () => {
      const player = await helper.firestore().doc('players/hyeonjilee').get();
      expect(player.data()).toMatchObject({
        level: 2
      });
      
      const events = await helper.firestore().collection('events').get();
      expect(events.docs.map(doc => doc.data())).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'demotion',
            payload: {
              ldap: 'hyeonjilee',
              levelFrom: 3,
              levelTo: 2
            }
          })
        ])
      );
    });
  })
});
