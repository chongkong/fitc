import * as testing from "@firebase/testing";
import * as admin from "firebase-admin";
import { Player, PlayerStats, FoosballTable } from "../common/types";

const DEFAULT_PROJECT_ID = "fitc-test";
const appName = "[TEST]";

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
      host: "localhost:8080",
      ssl: false
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
      app.firestore().doc(Player.path(ldap)),
      Player.create({ ldap, name, level })
    );
    batch.set(app.firestore().doc(PlayerStats.path(ldap)), PlayerStats.empty());
  });

  batch.set(
    app.firestore().doc(FoosballTable.path("default")),
    FoosballTable.create({
      name: "For Test",
      recentPlayers: fitcDevelopers.map(player => player.name)
    })
  );

  await batch.commit();
}

export function clearFirestoreData(projectId = DEFAULT_PROJECT_ID) {
  return testing.clearFirestoreData({ projectId });
}
