import * as firebase from '@firebase/testing';
import * as admin from 'firebase-admin';

export namespace helper {
  export const projectId = 'foosball-seo';
  export const auth = {
    uid: 'GpXfrqW6ntP15nNSxpevOitpfff2',
    email: 'jjong@google.com',
    displayName: 'Jongbin Park'
  };

  export function createFirebaseAdminApp() {
    const app = admin.initializeApp({ projectId });
    app.firestore().settings({
      host: 'localhost:8080',
      ssl: false,
    });
    return app;
  }

  export async function clearFirestoreData() {
    await firebase.clearFirestoreData({ projectId });
  }
}
