import * as admin from 'firebase-admin';

const app = admin.initializeApp();

export function firestore() {
  return app.firestore();
}

export function auth() {
  return app.auth();
}

export function storage() {
  return app.storage();
}
