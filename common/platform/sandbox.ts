import { firestore } from "@firebase/testing";
import { Platform } from "./base";
import { Factory } from "../factory";

export const sandbox: Platform = {
  now: () => firestore.Timestamp.now(),
  timestampFromDate: (dateArg: string) =>
    firestore.Timestamp.fromDate(new Date(dateArg))
};

export const factory = new Factory(sandbox);
