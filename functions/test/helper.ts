import * as testFactory from 'firebase-functions-test';
import * as testing from '@firebase/testing';

export const projectId = 'foosball-seo';

export const clearFirestoreData = () => testing.clearFirestoreData({ projectId });

export const test = testFactory({
  projectId,
  databaseURL: "http://localhost:8080",
});

export const jjongAuth = {
  uid: 'GpXfrqW6ntP15nNSxpevOitpfff2',
  email: 'jjong@google.com',
  displayName: 'Jongbin Park'
};
export const testApp = testing.initializeTestApp({
  projectId,
  auth: jjongAuth
});
