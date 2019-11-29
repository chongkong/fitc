import * as testing from '@firebase/testing';
import * as admin from 'firebase-admin';
import { createNewPlayer, createNewPlayerStats, createNewTable } from '../functions/src/factory';

const DEFAULT_PROJECT_ID = 'fitc-test';
const appName = '[TEST]';

/**
 * This creates a firebase-admin (server SDK) app. This is different from
 * client SDK app (some signatures are different) and must be used with
 * Timestamp in '@google-cloud/firestore' module.
 * This app is authorized as admin thus free from security checks.
 */
export function getOrInitializeAdminApp(projectId = DEFAULT_PROJECT_ID) {
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

/**
 * This creates a firebase (client SDK) app. This is different from server
 * SDK app (some signatures are different) and must be used with Timestamp
 * in '@firebase/firestore' module.
 * This app is authorized as jjong and cannot perform reads and writes for
 * unauthorized paths.
 */
export function createTestApp(projectId = DEFAULT_PROJECT_ID) {
  return testing.initializeTestApp({
    projectId,
    auth: {
      uid: 'GpXfrqW6ntP15nNSxpevOitpfff2',
      email: 'jjong@google.com',
      displayName: 'Jongbin Park'      
    }
  });
}

export async function cleanupTestApps() {
  await Promise.all(testing.apps().map(app => app.delete()))
}

export async function createDummyData() {
  const app = getOrInitializeAdminApp();
  const batch = app.firestore().batch();

  function createPlayer(ldap: string, name: string, level: number) {
    const player = createNewPlayer(name = name, ldap = ldap);
    player.level = level;
    player.isNewbie = level === 1;
    batch.set(app.firestore().collection('players').doc(ldap), player);
    return createPlayerStats(ldap);
  }

  function createPlayerStats(ldap: string) {
    const playerStats = createNewPlayerStats();
    batch.set(app.firestore().collection('playerStats').doc(ldap), playerStats);
  }

  function createTable(tableId: string, name: string, recentPlayers: string[]) {
    const table = createNewTable(name = name, recentPlayers = recentPlayers);
    batch.set(app.firestore().collection('tables').doc(tableId), table);
  }

  createPlayer('jjong', 'Jongbin Park', 2);
  createPlayer('hyeonjilee', 'Hyeonji Lee', 3);
  createPlayer('shinjiwon', 'Jiwon Shin', 2);
  createPlayer('anzor', 'Anzor Balkar', 4);
  createPlayer('hdmoon', 'Hyundo Moon', 2);

  createTable('default', 'Default table', ['jjong', 'hyeonjilee', 'shinjiwon', 'anzor', 'hdmoon']);

  await batch.commit();
};

export function clearFirestoreData(projectId = DEFAULT_PROJECT_ID) {
  return testing.clearFirestoreData({ projectId });
}
