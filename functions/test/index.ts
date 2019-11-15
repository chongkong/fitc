import * as testFactory from 'firebase-functions-test';
import * as firebase from '@firebase/testing';

export const projectId = 'foosball-seo';

export const test = testFactory({
  projectId,
  databaseURL: "http://localhost:8080",
});

export { firebase };
export const jjongAuth = {
  uid: 'GpXfrqW6ntP15nNSxpevOitpfff2',
  email: 'jjong@google.com',
  displayName: 'Jongbin Park'
};
export const firebaseApp = firebase.initializeTestApp({
  projectId,
  auth: jjongAuth
});
export const firestore = firebaseApp.firestore();

