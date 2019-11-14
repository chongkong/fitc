import { firebase, projectId, firestore, test } from '..';
import { initEmulator } from '../init-emulator';
import * as functions from '../../src';
import { PlayerStats } from '../../../common/types';

// Mock firestore to a local emulator.
jest.mock('../../src/admin', () => ({
  firestore 
}));

describe('onGameRecordCreate', () => {
  beforeEach(() => {
    return initEmulator();
  });

  afterEach(() => {
    return firebase.clearFirestoreData({ projectId });
  })

  describe('typical case', () => {
    beforeEach(async () => {
      const onGameRecordCreate = test.wrap(functions.onGameRecordCreate);
      await onGameRecordCreate({
        data: () => ({
          winners: [
            {playerId: 'jjong', level: 2}, 
            {playerId: 'hdmoon', level: 2}
          ],
          losers: [
            {playerId: 'shinjiwon', level: 2},
            {playerId: 'hyeonjilee', level: 3}
          ],
          isTie: false,
          winStreaks: 1,
          createdAt: new Date('2019-11-11T12:34:56'),
          recordedBy: 'jjong'
        })
      });
    });

    it('jjong@ stats changed', async () => {
      const jjongStatsSnapshot = await firestore.collection('stats').doc('jjong').get();
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
    });

    it('hdmoon@ stats changed', async () => {
      const hdmoonStatsSnapshot = await firestore.collection('stats').doc('hdmoon').get();
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

    })

    it('shinjiwon@ stats changed', async () => {
      const shinjiwonStatsSnapshot = await firestore.collection('stats').doc('shinjiwon').get();
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
    });

    it('hyeonjilee@ stats changed', async () => {
      const hyeonjileeStatsSnapshot = await firestore.collection('stats').doc('hyeonjilee').get();
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
    });
  });

  describe('consecutive wins', () => {
    
  });
});
