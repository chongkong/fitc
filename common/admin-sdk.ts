import { firestore } from "firebase-admin";

export namespace AdminSDK {

  export namespace Timestamp {
    export function fromDate(dateArgs: any) {
      return firestore.Timestamp.fromDate(new Date(dateArgs));
    }

    export function now() {
      return firestore.Timestamp.now();
    }
  }

}
