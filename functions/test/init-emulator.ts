import { createNewPlayer, createNewPlayerStats, createNewTable } from '../src/factory';
import { firestore } from '../src/admin';


export async function initEmulator() {
  const batch = firestore.batch();

  function addPlayer(ldap: string, name: string, level: number) {
    const player = createNewPlayer(name = name, ldap = ldap);
    player.level = level;
    player.isNewbie = level === 1;
    batch.set(firestore.collection('players').doc(ldap), player);
    return addPlayerStats(ldap);
  }

  function addPlayerStats(ldap: string) {
    const playerStats = createNewPlayerStats();
    batch.set(firestore.collection('stats').doc(ldap), playerStats);
  }

  function addTable(tableId: string, name: string, recentPlayers: string[]) {
    const table = createNewTable(name = name, recentPlayers = recentPlayers);
    batch.set(firestore.collection('tables').doc(tableId), table);
  }

  addPlayer('jjong', 'Jongbin Park', 2);
  addPlayer('hyeonjilee', 'Hyeonji Lee', 3);
  addPlayer('shinjiwon', 'Jiwon Shin', 2);
  addPlayer('anzor', 'Anzor Balkar', 4);
  addPlayer('hdmoon', 'Hyundo Moon', 4);

  addTable('default', 'Default table', ['jjong', 'hyeonjilee', 'shinjiwon', 'anzor', 'hdmoon']);

  console.info('Committing for firestore emulator..');
  await batch.commit();
  console.info('Firestore emulator initialized.');
};
