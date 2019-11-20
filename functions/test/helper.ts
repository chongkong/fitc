import * as firebase from '@firebase/testing';
import * as admin from 'firebase-admin';
import * as testFactory from 'firebase-functions-test';

export namespace helper {

  export const projectId = 'foosball-seo';

  export const auth = {
    uid: 'GpXfrqW6ntP15nNSxpevOitpfff2',
    email: 'jjong@google.com',
    displayName: 'Jongbin Park'
  };

  export function createFirebaseAuthedApp() { 
    return firebase.initializeTestApp({ projectId, auth });
  }
  
  export async function clearFirestoreData() {
    await firebase.clearFirestoreData({ projectId });
  }

  export function createFirebaseAdminApp() {
    const app = admin.initializeApp({ projectId });
    app.firestore().settings({
      host: 'localhost:8080',
      ssl: false,
    });
    return app;
  }

  export function createFirebaseFunctionsTest() {
    return testFactory({ projectId });
  }
}
