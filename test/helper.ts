import * as testing from '@firebase/testing';
import * as admin from 'firebase-admin';
import { createNewPlayer, createNewPlayerStats, createNewTable } from '../functions/src/factory';

const DEFAULT_PROJECT_ID = 'foosball-seo';
const appName = '[TEST]';

export function getOrInitializeTestApp(projectId = DEFAULT_PROJECT_ID) {
  try {
    return admin.app(appName);
  } catch {
    const app = admin.initializeApp({ projectId }, appName);
    app.firestore().settings({
      host: 'localhost:8080',
      ssl: false,
    });
    return app;
  }
}

export async function createDummyData() {
  const app = getOrInitializeTestApp();
  const batch = app.firestore().batch();

  function createlayer(ldap: string, name: string, level: number) {
    const player = createNewPlayer(name = name, ldap = ldap);
    player.level = level;
    player.isNewbie = level === 1;
    batch.create(app.firestore().collection('players').doc(ldap), player);
    return createlayerStats(ldap);
  }

  function createlayerStats(ldap: string) {
    const playerStats = createNewPlayerStats();
    batch.create(app.firestore().collection('stats').doc(ldap), playerStats);
  }

  function createTable(tableId: string, name: string, recentPlayers: string[]) {
    const table = createNewTable(name = name, recentPlayers = recentPlayers);
    batch.create(app.firestore().collection('tables').doc(tableId), table);
  }

  createlayer('jjong', 'Jongbin Park', 2);
  createlayer('hyeonjilee', 'Hyeonji Lee', 3);
  createlayer('shinjiwon', 'Jiwon Shin', 2);
  createlayer('anzor', 'Anzor Balkar', 4);
  createlayer('hdmoon', 'Hyundo Moon', 2);

  createTable('default', 'Default table', ['jjong', 'hyeonjilee', 'shinjiwon', 'anzor', 'hdmoon']);

  await batch.commit();
};

export function clearFirestoreData(projectId = DEFAULT_PROJECT_ID) {
  return testing.clearFirestoreData({ projectId });
}
