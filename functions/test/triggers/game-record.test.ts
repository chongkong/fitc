import * as admin from 'firebase-admin';

import { helper } from '../helper';
import { createInitialData } from '../init-emulator';
import { app } from '../../src/firebase';
import { GameRecord, PlayerStats } from '../../../common/types';

// Mock firestore to a local emulator.
// Note that testApp doesn't support auth, and we have to manually mock
// the auth() service for each usage.
jest.mock('../../src/firebase', () => {
  const app = helper.createFirebaseAdminApp();
  return { app };
});

const test = helper.createFirebaseFunctionsTest();

describe.only('onGameRecordDelete', () => {
  afterAll(() => {
    test.cleanup();
  });

  describe('On delete', () => {
    let unsubscribe: () => void;

    beforeAll(async (done) => {
      await helper.clearFirestoreData();
      await createInitialData(app);
     
      const now = admin.firestore.Timestamp.fromDate(new Date('2019-11-11T12:34:56'));
      const data: GameRecord = {
        winners: ['jjong', 'hdmoon'], 
        losers: ['shinjiwon', 'hyeonjilee'],
        isTie: false,
        winStreaks: 1,
        createdAt: now,
        recordedBy: 'jjong'
      };
      let count = 0;
      unsubscribe = app.firestore().doc('stats/hyeonjilee').onSnapshot(snapshot => {
        count += 1;
        console.info(count);
        console.info(snapshot.data());
        if (count === 1) {
          done();
        }
      })

      const ref = app.firestore().doc(`tables/default/records/${now.toMillis()}`);
      await ref.set(data);
      await ref.delete();
    
      
    });
    afterAll(() => {
      unsubscribe();
    })

    it('stats is reset', async () => {
      const snapshot = await app.firestore().doc('stats/hyeonjilee').get();
      const stats = snapshot.data() as PlayerStats
      expect(stats).toMatchObject({
        totalWins:0,
        totalLoses:0,
        recentGames:'',
        perSeason: {
          2019: {
            totalWins: 0,
            totalLoses: 0
          }
        },
        asOpponent: {
          jjong: {
            totalWins: 0,
            totalLoses: 0,
            recentGames:''
          },
          hdmoon: {
            totalWins: 0,
            totalLoses: 0,
            recentGames:''
          }
        },
        asTeammate: {
          shinjiwon: {
            totalWins: 0,
            totalLoses: 0,
            recentGames:''
          }
        }
      })

    });
  });

});