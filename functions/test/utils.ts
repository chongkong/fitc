import * as testing from "@firebase/testing";

export function sleep(millis: number) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), millis);
  });
}

export class TypedFirestoreWrapper {
  constructor(private firestore: testing.firestore.Firestore) {}

  // prettier-ignore
  async setDoc <T>(path: string, data: T): Promise<void> {
    await this.firestore.doc(path).set(data);
  }

  // prettier-ignore
  async getDoc<T>(path: string): Promise<T | undefined> {
    const snapshot = await this.firestore.doc(path).get();
    return snapshot.exists ? (snapshot.data() as T) : undefined;
  }

  async getDocs<T>(...paths: string[]): Promise<(T | undefined)[]> {
    return Promise.all(paths.map(path => this.getDoc<T>(path)));
  }

  async listDocs<T>(path: string): Promise<T[]> {
    const querySnapshot = await this.firestore.collection(path).get();
    return querySnapshot.docs.map(doc => doc.data() as T);
  }
}
