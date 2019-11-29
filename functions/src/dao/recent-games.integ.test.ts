import { AdminSDK } from '../../../common/admin-sdk';
import { GameRecord } from '../../../common/types';
import * as helper from '../../../test/helper';
import { listPlayerRecentGames } from './recent-games';

// Use firebase emulator
jest.mock('../firebase', () => {
  const app = helper.getOrInitializeAdminApp();
  return {
    firestore: () => app.firestore()
  };
});

beforeAll(async () => {
  await helper.clearFirestoreData();
})

describe('listPlayerRecentGames', () => {
  const app = helper.getOrInitializeAdminApp();

  describe('Given typical record', () => {
    const record: GameRecord = {
      winners: ['jjong', 'hyeonjilee'],
      losers: ['shinjiwon', 'hdmoon'],
      isDraw: false,
      winStreaks: 1,
      recordedBy: 'jjong',
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:00')
    };

    beforeAll(async () => {
      await helper.createDummyData();
      await app.firestore().doc('tables/default/records/1').create(record);
    })

    afterAll(async () => {
      await helper.clearFirestoreData();
    })

    test('Fetch winning record', async () => {
      for (const ldap of record.winners) {
        const recentGames = await listPlayerRecentGames({ldap});
        expect(recentGames).toEqual([record]);
      }
    });

    test('Fetch losing record', async () => {
      for (const ldap of record.losers) {
        const recentGames = await listPlayerRecentGames({ldap});
        expect(recentGames).toEqual([record]);
      }
    });

    test('Does not fetch records not mine', async () => {
      const recentGames = await listPlayerRecentGames({ldap: 'anzor'});
      expect(recentGames.length).toBe(0);
    });
  

  });

  describe('Given draw record', () => {
    const drawRecord: GameRecord = {
      winners: ['jjong', 'hyeonjilee'],
      losers: ['shinjiwon', 'hdmoon'],
      isDraw: true,
      winStreaks: 0,
      recordedBy: 'jjong',
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:00')
    };

    beforeAll(async () => {
      await helper.createDummyData();
      await app.firestore().doc('tables/default/records/1').create(drawRecord);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    })

    test('Fetch draw record', async () => {
      for (const ldap of drawRecord.winners) {
        const recentGames = await listPlayerRecentGames({ldap});
        expect(recentGames).toEqual([drawRecord]);
      }
      for (const ldap of drawRecord.losers) {
        const recentGames = await listPlayerRecentGames({ldap});
        expect(recentGames).toEqual([drawRecord]);
      }
    });

  });
  
  describe('Records in multiple tables', () => {
    const baseRecord: Partial<GameRecord> = {
      winners: ['jjong', 'hyeonjilee'],
      losers: ['shinjiwon', 'hdmoon'],
      isDraw: false,
      winStreaks: 1,
      recordedBy: 'jjong'
    };
    const r1 = Object.assign({}, baseRecord, {
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:00')
    });
    const r2 = Object.assign({}, baseRecord, {
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:01')
    });

    beforeAll(async () => {
      await helper.createDummyData();
      await app.firestore().doc('tables/default/records/1').create(r1);
      await app.firestore().doc('tables/other/records/2').create(r2);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    })

    test('Fetch all records from all tables', async () => {
      const recentGames = await listPlayerRecentGames({ldap: 'jjong'});
      expect(recentGames).toEqual([r2, r1]);
    })

  });

  describe('Given three records', () => {
    const baseRecord: Partial<GameRecord> = {
      isDraw: false,
      winStreaks: 1,
      recordedBy: 'jjong'
    };
    // jjong win
    const r1 = Object.assign({}, baseRecord, {
      winners: ['jjong', 'hdmoon'],
      losers: ['shinjiwon', 'anzor'],
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:00'),
    });
    // jjong lose
    const r2 = Object.assign({}, baseRecord, {
      winners: ['shinjiwon', 'anzor'],
      losers: ['jjong', 'hdmoon'],
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:01:00'),
    });
    // jjong draw
    const r3 = Object.assign({}, baseRecord, {
      winners: ['shinjiwon', 'anzor'],
      losers: ['jjong', 'hdmoon'],
      isDraw: true,
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:02:00'),
    });
    // no jjong
    const r4 = Object.assign({}, baseRecord, {
      winners: ['shinjiwon', 'anzor'],
      losers: ['hyeonjilee', 'hdmoon'],
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:03:00'),
    });

    beforeAll(async () => {
      await helper.createDummyData();
      await app.firestore().doc('tables/default/records/1').set(r1);
      await app.firestore().doc('tables/default/records/2').set(r2);
      await app.firestore().doc('tables/default/records/3').set(r3);
      await app.firestore().doc('tables/default/records/4').set(r4);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    })

    test('orderBy works', async () => {
      const recentGames = await listPlayerRecentGames({ldap: 'jjong'});
      expect(recentGames).toEqual([r3, r2, r1]);
    });

    test('limit works', async () => {
      const recentGames = await listPlayerRecentGames({ldap: 'jjong', limit: 1});
      expect(recentGames).toEqual([r3]);
    });

    test('rangeAfter works', async () => {
      const recentGames = await listPlayerRecentGames({ldap: 'jjong', rangeAfter: r1.createdAt});
      expect(recentGames).toEqual([r3, r2]);
    });

    test('resultOnly works', async () => {
      const recentGames = await listPlayerRecentGames({ldap: 'jjong', resultOnly: true});
      expect(recentGames).toEqual(['D', 'L', 'W']);
    })

  });

});
