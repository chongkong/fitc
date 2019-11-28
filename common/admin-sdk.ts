import { Timestamp as AdminTimestamp } from "@google-cloud/firestore";

export namespace AdminSDK {

  export namespace Timestamp {
    export function fromDate(dateArgs: any) {
      return AdminTimestamp.fromDate(new Date(dateArgs));
    }

    export function now() {
      return AdminTimestamp.now();
    }
  }

}
