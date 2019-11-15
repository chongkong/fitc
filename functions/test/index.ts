import * as testFactory from 'firebase-functions-test';
import * as firebase from '@firebase/testing';

export const projectId = 'foosball-seo';

export const test = testFactory({
  projectId,
  databaseURL: "http://localhost:8080",
});

export { firebase };
export const firebaseApp = firebase.initializeAdminApp({ projectId });
export const firestore = firebaseApp.firestore();
export const firebaseAuth = firebaseApp.auth();
