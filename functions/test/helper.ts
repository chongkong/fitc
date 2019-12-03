import * as testing from "@firebase/testing";
import * as admin from "firebase-admin";
import { Path } from "../../common/path";
import { factory } from "../../common/platform/admin";

const random = Math.random()
  .toString(36)
  .slice(2);
const APP_NAME = `[TEST-${random}]`;

/**
 * This creates a firebase-admin (server SDK) app. This is different from
 * client SDK app (some signatures are different) and must be used with
 * Timestamp in '@google-cloud/firestore' module.
 * This app is authorized as admin thus free from security checks.
 */
export function getOrInitializeAdminApp() {
  try {
    return admin.app(APP_NAME);
  } catch {
    const app = admin.initializeApp({ projectId: "foosball-seo" }, APP_NAME);
    app.firestore().settings({
      host: "localhost:8080",
      ssl: false
    });
    return app;
  }
}

/**
 * This creates a firebase (client SDK) app. This is different from server
 * SDK app (some signatures are different) and must be used with Timestamp
 * in '@firebase/testing' module.
 * This app is authorized as jjong and cannot perform reads and writes for
 * unauthorized paths.
 */
export function initializeTestApp() {
  return testing.initializeTestApp({
    projectId: "foosball-seo",
    auth: {
      uid: "GpXfrqW6ntP15nNSxpevOitpfff2",
      email: "jjong@google.com",
      displayName: "Jongbin Park"
    }
  });
}

export async function cleanupTestApps() {
  await Promise.all(testing.apps().map(app => app.delete()));
}

export async function createDummyData() {
  const app = getOrInitializeAdminApp();
  const batch = app.firestore().batch();

  const fitcDevelopers = [
    { ldap: "jjong", name: "Jongbin Park", level: 2 },
    { ldap: "hyeonjilee", name: "Hyeonji Lee", level: 3 },
    { ldap: "shinjiwon", name: "Jiwon Shin", level: 2 },
    { ldap: "anzor", name: "Anzor Balkar", level: 4 },
    { ldap: "hdmoon", name: "Hyundo Moon", level: 2 }
  ];

  fitcDevelopers.forEach(({ ldap, name, level }) => {
    batch.set(
      app.firestore().doc(Path.player(ldap)),
      factory.createPlayer({ ldap, name, level })
    );
    batch.set(
      app.firestore().doc(Path.playerStats(ldap)),
      factory.emptyPlayerStats()
    );
  });

  batch.set(
    app.firestore().doc(Path.table("default")),
    factory.createTable({
      name: "For Test",
      recentPlayers: fitcDevelopers.map(player => player.name)
    })
  );

  await batch.commit();
}

export function clearFirestoreData() {
  return testing.clearFirestoreData({ projectId: "foosball-seo" });
}
