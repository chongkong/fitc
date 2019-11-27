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
      });
    });
  });
});
