import { AdminSDK } from '../../../common/admin-sdk';
import { GameRecord } from '../../../common/types';
import * as helper from '../../../test/helper';
import { listPlayerRecentGames, listPlayerRecentGamesAsSymbol } from './recent-games';

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
      isTie: false,
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
        const recentGames = await listPlayerRecentGames(ldap)
        expect(recentGames).toStrictEqual([record]);
      }
    });

    test('Fetch losing record', async () => {
      for (const ldap of record.losers) {
        const recentGames = await listPlayerRecentGames(ldap)
        expect(recentGames).toStrictEqual([record]);
      }
    });

    test('Does not fetch records not mine', async () => {
      const recentGames = await listPlayerRecentGames('anzor');
      expect(recentGames.length).toBe(0);
    });
  

  });

  describe('Given draw record', () => {
    const drawRecord: GameRecord = {
      winners: ['jjong', 'hyeonjilee'],
      losers: ['shinjiwon', 'hdmoon'],
      isTie: true,
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
        const recentGames = await listPlayerRecentGames(ldap)
        expect(recentGames).toStrictEqual([drawRecord]);
      }
      for (const ldap of drawRecord.losers) {
        const recentGames = await listPlayerRecentGames(ldap)
        expect(recentGames).toStrictEqual([drawRecord]);
      }
    });

  });
  
  describe('Records in multiple tables', () => {
    const baseRecord: Partial<GameRecord> = {
      winners: ['jjong', 'hyeonjilee'],
      losers: ['shinjiwon', 'hdmoon'],
      isTie: false,
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
      const recentGames = await listPlayerRecentGames('jjong');
      expect(recentGames).toStrictEqual([r2, r1]);
    })

  });

  describe('Given three records', () => {
    const baseRecord: Partial<GameRecord> = {
      winners: ['jjong', 'hyeonjilee'],
      losers: ['shinjiwon', 'hdmoon'],
      isTie: false,
      winStreaks: 1,
      recordedBy: 'jjong'
    };
    const r1 = Object.assign({}, baseRecord, {
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:00')
    });
    const r2 = Object.assign({}, baseRecord, {
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:01')
    });
    const r3 = Object.assign({}, baseRecord, {
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:02')
    });

    beforeAll(async () => {
      await helper.createDummyData();
      await app.firestore().doc('tables/default/records/1').create(r1);
      await app.firestore().doc('tables/default/records/2').create(r2);
      await app.firestore().doc('tables/default/records/3').create(r3);
    });

    afterAll(async () => {
      await helper.clearFirestoreData();
    })

    test('orderBy works', async () => {
      const recentGames = await listPlayerRecentGames('jjong');
      expect(recentGames).toStrictEqual([r3, r2, r1]);
    });

    test('limit works', async () => {
      const recentGames = await listPlayerRecentGames('jjong', undefined, 1);
      expect(recentGames).toStrictEqual([r3]);
    });

    test('rangeAfter works', async () => {
      const recentGames = await listPlayerRecentGames('jjong', r1.createdAt);
      expect(recentGames).toStrictEqual([r3, r2]);

    });

  });

});


describe('listPlayerRecentGamesAsSymbol', () => {
  const app = helper.getOrInitializeAdminApp();

  beforeEach(async () => {
    await helper.createDummyData();
  })

  afterEach(async () => {
    await helper.clearFirestoreData();
  })

  test('Check return values', async () => {
    // Game 1: Win
    await app.firestore().doc('tables/default/records/1').set({
      winners: ['jjong', 'hdmoon'],
      losers: ['shinjiwon', 'anzor'],
      isTie: false,
      winStreaks: 1,
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:00:00'),
      recordedBy: 'jjong'
    });
    // Game 2: Lose
    await app.firestore().doc('tables/default/records/2').set({
      winners: ['shinjiwon', 'anzor'],
      losers: ['jjong', 'hdmoon'],
      isTie: false,
      winStreaks: 1,
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:01:00'),
      recordedBy: 'jjong'
    });
    // Game 3: Draw
    await app.firestore().doc('tables/default/records/3').set({
      winners: ['shinjiwon', 'anzor'],
      losers: ['jjong', 'hdmoon'],
      isTie: true,
      winStreaks: 1,
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:02:00'),
      recordedBy: 'jjong'
    });
    // Game 4: Not participated
    await app.firestore().doc('tables/default/records/4').set({
      winners: ['shinjiwon', 'anzor'],
      losers: ['hyeonjilee', 'hdmoon'],
      isTie: false,
      winStreaks: 1,
      createdAt: AdminSDK.Timestamp.fromDate('2019-01-01T00:03:00'),
      recordedBy: 'jjong'
    });
    
    const recentGames = await listPlayerRecentGamesAsSymbol('jjong');

    expect(recentGames).toStrictEqual(['D', 'L', 'W']);
  })
});
