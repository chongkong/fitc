import { firestore } from "@firebase/testing";

export namespace ClientSDK {

  export namespace Timestamp {
    export function fromDate(dateArgs: any) {
      return firestore.Timestamp.fromDate(new Date(dateArgs));
    }

    export function now() {
      return firestore.Timestamp.now();
    }
  }

}