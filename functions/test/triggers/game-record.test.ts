// import { firestore as fs } from 'firebase';
import { firestore as fs } from 'firebase';

import { test, createTestApp, jjongAuth, clearFirestoreData } from '../helper';
import { initEmulator } from '../init-emulator';
import * as functions from '../../src';
import { app } from '../../src/firebase';
import { PlayerStats, GameRecord, Event } from '../../../common/types';

// Mock firestore to a local emulator.
// Note that testApp doesn't support auth, and we have to manually mock
// the auth() service for each usage.
jest.mock('../../src/firebase', () => {
  const app = createTestApp();
  return {
    app: {
      firestore: () => app.firestore(),
      auth: () => ({
        getUser: async () => jjongAuth
      }),
      delete: () => app.delete()
    }
  }
});

afterAll(async (done) => {
  await app.delete();
  done();
});

describe('onGameRecordCreate', () => {
  const onGameRecordCreate = test.wrap(functions.onGameRecordCreate);

  describe('[Case] First Game', () => {
    const theRecord: GameRecord = {
      winners: ['jjong', 'hdmoon'],
      losers: ['shinjiwon', 'hyeonjilee'],
      isTie: false,
      winStreaks: 1,
      createdAt: fs.Timestamp.fromDate(new Date('2019-11-11T12:34:56')),
      recordedBy: 'jjong',
    };

    beforeAll(async (done) => {
      await initEmulator();
      await onGameRecordCreate({
        data: () => theRecord
      });
      done();
    });

    afterAll(async (done) => {
      test.cleanup();
      await clearFirestoreData();
      done();
    })

    it('jjong@ stats changed', async (done) => {
      const jjongStatsSnapshot = await app.firestore().collection('stats').doc('jjong').get();
      const jjongStats = jjongStatsSnapshot.data() as PlayerStats;
      // Global stats
      expect(jjongStats.totalWins).toBe(1);
      expect(jjongStats.totalLoses).toBe(0);
      expect(jjongStats.mostWinStreaks).toBe(1);
      expect(jjongStats.recentGames).toBe('W');
      // Season stats
      expect(jjongStats.perSeason['2019'].totalWins).toBe(1);
      expect(jjongStats.perSeason['2019'].totalLoses).toBe(0);
      // Teammate stats
      expect(jjongStats.asTeammate['hdmoon'].totalWins).toBe(1);
      expect(jjongStats.asTeammate['hdmoon'].totalLoses).toBe(0);
      expect(jjongStats.asTeammate['hdmoon'].recentGames).toBe('W');
      // Opponent stats
      expect(jjongStats.asOpponent['shinjiwon'].totalWins).toBe(1);
      expect(jjongStats.asOpponent['shinjiwon'].totalLoses).toBe(0);
      expect(jjongStats.asOpponent['shinjiwon'].recentGames).toBe('W');
      // Opponent stats
      expect(jjongStats.asOpponent['hyeonjilee'].totalWins).toBe(1);
      expect(jjongStats.asOpponent['hyeonjilee'].totalLoses).toBe(0);
      expect(jjongStats.asOpponent['hyeonjilee'].recentGames).toBe('W');

      done();
    });

    it('hdmoon@ stats changed', async (done) => {
      const hdmoonStatsSnapshot = await app.firestore()
      .collection('stats').doc('hdmoon').get();
      const hdmoonStats = hdmoonStatsSnapshot.data() as PlayerStats;
      // Global stats
      expect(hdmoonStats.totalWins).toBe(1);
      expect(hdmoonStats.totalLoses).toBe(0);
      expect(hdmoonStats.mostWinStreaks).toBe(1);
      expect(hdmoonStats.recentGames).toBe('W');
      // Season stats
      expect(hdmoonStats.perSeason['2019'].totalWins).toBe(1);
      expect(hdmoonStats.perSeason['2019'].totalLoses).toBe(0);
      // Teammate stats
      expect(hdmoonStats.asTeammate['jjong'].totalWins).toBe(1);
      expect(hdmoonStats.asTeammate['jjong'].totalLoses).toBe(0);
      expect(hdmoonStats.asTeammate['jjong'].recentGames).toBe('W');
      // Opponent stats
      expect(hdmoonStats.asOpponent['shinjiwon'].totalWins).toBe(1);
      expect(hdmoonStats.asOpponent['shinjiwon'].totalLoses).toBe(0);
      expect(hdmoonStats.asOpponent['shinjiwon'].recentGames).toBe('W');
      // Opponent stats
      expect(hdmoonStats.asOpponent['hyeonjilee'].totalWins).toBe(1);
      expect(hdmoonStats.asOpponent['hyeonjilee'].totalLoses).toBe(0);
      expect(hdmoonStats.asOpponent['hyeonjilee'].recentGames).toBe('W');

      done();
    })

    it('shinjiwon@ stats changed', async (done) => {
      const shinjiwonStatsSnapshot = await app.firestore()
      .collection('stats').doc('shinjiwon').get();
      const shinjiwonStats = shinjiwonStatsSnapshot.data() as PlayerStats;
      // Global stats
      expect(shinjiwonStats.totalWins).toBe(0);
      expect(shinjiwonStats.totalLoses).toBe(1);
      expect(shinjiwonStats.mostWinStreaks).toBe(0);
      expect(shinjiwonStats.recentGames).toBe('L');
      // Season stats
      expect(shinjiwonStats.perSeason['2019'].totalWins).toBe(0);
      expect(shinjiwonStats.perSeason['2019'].totalLoses).toBe(1);
      // Teammate stats
      expect(shinjiwonStats.asTeammate['hyeonjilee'].totalWins).toBe(0);
      expect(shinjiwonStats.asTeammate['hyeonjilee'].totalLoses).toBe(1);
      expect(shinjiwonStats.asTeammate['hyeonjilee'].recentGames).toBe('L');
      // Opponent stats
      expect(shinjiwonStats.asOpponent['jjong'].totalWins).toBe(0);
      expect(shinjiwonStats.asOpponent['jjong'].totalLoses).toBe(1);
      expect(shinjiwonStats.asOpponent['jjong'].recentGames).toBe('L');
      // Opponent stats
      expect(shinjiwonStats.asOpponent['hdmoon'].totalWins).toBe(0);
      expect(shinjiwonStats.asOpponent['hdmoon'].totalLoses).toBe(1);
      expect(shinjiwonStats.asOpponent['hdmoon'].recentGames).toBe('L');

      done();
    });

    it('hyeonjilee@ stats changed', async (done) => {
      const hyeonjileeStatsSnapshot = await app.firestore()
      .collection('stats').doc('hyeonjilee').get();
      const hyeonjileeStats = hyeonjileeStatsSnapshot.data() as PlayerStats;
      // Global stats
      expect(hyeonjileeStats.totalWins).toBe(0);
      expect(hyeonjileeStats.totalLoses).toBe(1);
      expect(hyeonjileeStats.mostWinStreaks).toBe(0);
      expect(hyeonjileeStats.recentGames).toBe('L');
      // Season stats
      expect(hyeonjileeStats.perSeason['2019'].totalWins).toBe(0);
      expect(hyeonjileeStats.perSeason['2019'].totalLoses).toBe(1);
      // Teammate stats
      expect(hyeonjileeStats.asTeammate['shinjiwon'].totalWins).toBe(0);
      expect(hyeonjileeStats.asTeammate['shinjiwon'].totalLoses).toBe(1);
      expect(hyeonjileeStats.asTeammate['shinjiwon'].recentGames).toBe('L');
      // Opponent stats
      expect(hyeonjileeStats.asOpponent['jjong'].totalWins).toBe(0);
      expect(hyeonjileeStats.asOpponent['jjong'].totalLoses).toBe(1);
      expect(hyeonjileeStats.asOpponent['jjong'].recentGames).toBe('L');
      // Opponent stats
      expect(hyeonjileeStats.asOpponent['hdmoon'].totalWins).toBe(0);
      expect(hyeonjileeStats.asOpponent['hdmoon'].totalLoses).toBe(1);
      expect(hyeonjileeStats.asOpponent['hdmoon'].recentGames).toBe('L');

      done();
    });
  });

  describe('[Case] 10 Consecutive Wins', () => {
    beforeAll(async (done) => {
      await initEmulator();
      for (let winStreaks = 1; winStreaks <= 10; ++winStreaks) {
        const now = fs.Timestamp.now();
        await app.firestore().doc(`tables/default/records/${now.toMillis()}`).set({
          winners: ['jjong', 'hdmoon'], 
          losers: ['shinjiwon', 'hyeonjilee'],
          isTie: false,
          winStreaks,
          createdAt: now,
          recordedBy: 'jjong',
          preventEvent: true,
        });
      }

      // setTimeout(() => done(), 1000);

      const now = fs.Timestamp.now();
      await onGameRecordCreate({
        data: () => ({
          winners: ['jjong', 'hdmoon'], 
          losers: ['shinjiwon', 'hyeonjilee'],
          winStreaks: 10,
          isTie: false,
          createdAt: now,
          recordedBy: 'jjong',
        })
      });

      done();
    });

    afterAll(async (done) => {
      test.cleanup();
      await clearFirestoreData();
      done();
    });

    it('Events created', async (done) => {
      const events = await app.firestore().collection('events').get();
      const eventsByLdap = events.docs.reduce((dict: {[key: string]: Event}, curr) => {
        const event = curr.data() as Event;
        dict[event.payload.ldap] = event;
        return dict;
      }, {});

      expect(eventsByLdap['jjong'].type).toBe('promotion');
      expect(eventsByLdap['jjong'].payload.levelFrom).toBe(2);
      expect(eventsByLdap['jjong'].payload.levelTo).toBe(3);

      expect(eventsByLdap['hdmoon'].type).toBe('promotion');
      expect(eventsByLdap['hdmoon'].payload.levelFrom).toBe(2);
      expect(eventsByLdap['hdmoon'].payload.levelTo).toBe(3);

      expect(eventsByLdap['shinjiwon'].type).toBe('demotion');
      expect(eventsByLdap['shinjiwon'].payload.levelFrom).toBe(2);
      expect(eventsByLdap['shinjiwon'].payload.levelTo).toBe(1);

      expect(eventsByLdap['hyeonjilee'].type).toBe('demotion');
      expect(eventsByLdap['hyeonjilee'].payload.levelFrom).toBe(3);
      expect(eventsByLdap['hyeonjilee'].payload.levelTo).toBe(2);

      done();
    })
  });
});
