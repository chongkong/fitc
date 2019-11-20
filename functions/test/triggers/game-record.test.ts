import * as admin from 'firebase-admin';

import { helper } from '../helper';
import { createInitialData } from '../init-emulator';
import * as functions from '../../src';
import { app } from '../../src/firebase';
import { GameRecord } from '../../../common/types';

// Mock firestore to a local emulator.
// Note that testApp doesn't support auth, and we have to manually mock
// the auth() service for each usage.
jest.mock('../../src/firebase', () => {
  const adminApp = helper.createFirebaseAdminApp();
  return {
    app: {
      firestore: () => adminApp.firestore(),
      auth: () => ({
        getUser: () => Promise.resolve(helper.auth)
      }),
      delete: () => adminApp.delete()
    }
  }
});

const test = helper.createFirebaseFunctionsTest();

describe('onGameRecordCreate', () => {
  const onGameRecordCreate = test.wrap(functions.onGameRecordCreate);

  afterAll(() => {
    test.cleanup();
  });

  describe('On first game', () => {

    beforeAll(async () => {
      await helper.clearFirestoreData();
      await createInitialData(app);
      await onGameRecordCreate({
        data: () => ({
          winners: ['jjong', 'hdmoon'],
          losers: ['shinjiwon', 'hyeonjilee'],
          isTie: false,
          winStreaks: 1,
          createdAt: admin.firestore.Timestamp.fromDate(new Date('2019-11-11T12:34:56')),
          recordedBy: 'jjong',
        })
      });
    });

    it('jjong@ stats created', async () => {
      const stats = await app.firestore().doc('stats/jjong').get();
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

    it('hdmoon@ stats created', async () => {
      const stats = await app.firestore().doc('stats/hdmoon').get();
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
    })

    it('shinjiwon@ stats created', async () => {
      const stats = await app.firestore().doc('stats/shinjiwon').get();
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

    it('hyeonjilee@ stats created', async () => {
      const stats = await app.firestore().doc('stats/hyeonjilee').get();
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

  describe('On tie game', () => {

    beforeAll(async () => {
      await helper.clearFirestoreData();
      await createInitialData(app);
    });

    it('No promise returned', () => {
      const result = onGameRecordCreate({
        data: () => ({
          winners: ['jjong', 'hdmoon'],
          losers: ['shinjiwon', 'hyeonjilee'],
          isTie: true,
          winStreaks: 0,
          createdAt: admin.firestore.Timestamp.now(),
          recordedBy: 'jjong',
        })
      });
      expect(result).toBeUndefined();
    })
  })

  describe('On 10 win streaks', () => {

    beforeAll(async () => {
      await helper.clearFirestoreData();
      await createInitialData(app);

      for (let winStreaks = 1; winStreaks <= 10; ++winStreaks) {
        const now = admin.firestore.Timestamp.now();
        const baseData: GameRecord = {
          winners: ['jjong', 'hdmoon'], 
          losers: ['shinjiwon', 'hyeonjilee'],
          isTie: false,
          winStreaks,
          createdAt: now,
          recordedBy: 'jjong'
        };
        await app.firestore()
          .doc(`tables/default/records/${now.toMillis()}`)
          .set({ ...baseData, __preventTrigger: true });
        await onGameRecordCreate({
          data: () => baseData
        });
      }
    });

    it('Events created', async () => {
      const events = await app.firestore().collection('events').get();
      const eventsData = events.docs.map(doc => doc.data());
      eventsData.sort((a, b) => a.payload.ldap.localeCompare(b.payload.ldap));

      expect(eventsData).toMatchObject([{
        type: 'promotion',
        payload: {
          ldap: 'hdmoon',
          levelFrom: 2,
          levelTo: 3,
        }
      }, {
        type: 'demotion',
        payload: {
          ldap: 'hyeonjilee',
          levelFrom: 3,
          levelTo: 2,
        }
      }, {
        type: 'promotion',
        payload: {
          ldap: 'jjong',
          levelFrom: 2,
          levelTo: 3,
        }
      }, {
        type: 'demotion',
        payload: {
          ldap: 'shinjiwon',
          levelFrom: 2,
          levelTo: 1,
        }
      }]);
    })
  });
});
