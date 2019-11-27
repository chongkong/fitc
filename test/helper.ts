import * as testing from '@firebase/testing';
export { Timestamp } from '@google-cloud/firestore';
import * as admin from 'firebase-admin';
import { createNewPlayer, createNewPlayerStats, createNewTable } from '../functions/src/factory';

export namespace helper {

  const projectId = 'foosball-seo';
  const appName = '[TEST]';

  function app() {
    try {
      return admin.app(appName);
    } catch {
      const app = admin.initializeApp({ projectId }, appName);
      console.info('Firebase App created.');
      app.firestore().settings({
        host: 'localhost:8080',
        ssl: false,
      });
      return app;
    }
  }

  export function firestore() { 
    return app().firestore();
  }

  export function auth() {
    return app().auth();
  }

  export function storage() {
    return app().storage();
  }

  export async function createDummyData() {
    const batch = firestore().batch();
  
    function createlayer(ldap: string, name: string, level: number) {
      const player = createNewPlayer(name = name, ldap = ldap);
      player.level = level;
      player.isNewbie = level === 1;
      batch.create(firestore().collection('players').doc(ldap), player);
      return createlayerStats(ldap);
    }
  
    function createlayerStats(ldap: string) {
      const playerStats = createNewPlayerStats();
      batch.create(firestore().collection('stats').doc(ldap), playerStats);
    }
  
    function createTable(tableId: string, name: string, recentPlayers: string[]) {
      const table = createNewTable(name = name, recentPlayers = recentPlayers);
      batch.create(firestore().collection('tables').doc(tableId), table);
    }
  
    createlayer('jjong', 'Jongbin Park', 2);
    createlayer('hyeonjilee', 'Hyeonji Lee', 3);
    createlayer('shinjiwon', 'Jiwon Shin', 2);
    createlayer('anzor', 'Anzor Balkar', 4);
    createlayer('hdmoon', 'Hyundo Moon', 2);

    createTable('default', 'Default table', ['jjong', 'hyeonjilee', 'shinjiwon', 'anzor', 'hdmoon']);

    await batch.commit();
    console.info((await firestore().collection('players').get()).docs.map(d => d.data()));
    console.info('Initial firestore emulator data committed.');
  };

  export function clearFirestoreData() {
    return testing.clearFirestoreData({ projectId });
  }
}
