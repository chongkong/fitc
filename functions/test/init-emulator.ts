import * as admin from 'firebase-admin';
import { createNewPlayer, createNewPlayerStats, createNewTable } from '../src/factory';


export async function createInitialData(app: admin.app.App) {
  const batch = app.firestore().batch();

  function addPlayer(ldap: string, name: string, level: number) {
    const player = createNewPlayer(name = name, ldap = ldap);
    player.level = level;
    player.isNewbie = level === 1;
    batch.set(app.firestore().collection('players').doc(ldap), player);
    return addPlayerStats(ldap);
  }

  function addPlayerStats(ldap: string) {
    const playerStats = createNewPlayerStats();
    batch.set(app.firestore().collection('stats').doc(ldap), playerStats);
  }

  function addTable(tableId: string, name: string, recentPlayers: string[]) {
    const table = createNewTable(name = name, recentPlayers = recentPlayers);
    batch.set(app.firestore().collection('tables').doc(tableId), table);
  }

  addPlayer('jjong', 'Jongbin Park', 2);
  addPlayer('hyeonjilee', 'Hyeonji Lee', 3);
  addPlayer('shinjiwon', 'Jiwon Shin', 2);
  addPlayer('anzor', 'Anzor Balkar', 4);
  addPlayer('hdmoon', 'Hyundo Moon', 2);

  addTable('default', 'Default table', ['jjong', 'hyeonjilee', 'shinjiwon', 'anzor', 'hdmoon']);

  await batch.commit();
  console.info('Initial firestore emulator data committed.');
};
