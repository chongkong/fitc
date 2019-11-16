import * as testFactory from 'firebase-functions-test';
import * as testing from '@firebase/testing';

export const projectId = 'foosball-seo';

export { testing };
export async function clearFirestoreData() {
  await testing.clearFirestoreData({ projectId });
}

// Higher nodejs version bug
// https://github.com/firebase/firebase-functions/issues/437
process.env.GCLOUD_PROJECT = projectId;

export const test = testFactory({
  projectId,
  databaseURL: "http://localhost:8080",
});

export const jjongAuth = {
  uid: 'GpXfrqW6ntP15nNSxpevOitpfff2',
  email: 'jjong@google.com',
  displayName: 'Jongbin Park'
};

export function createTestApp() { 
  return testing.initializeTestApp({ projectId, auth: jjongAuth });
}
