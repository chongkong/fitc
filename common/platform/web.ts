import { firestore } from "firebase";
import { Platform } from "./base";
import { Factory } from "../factory";

export const web: Platform = {
  now: () => firestore.Timestamp.now(),
  timestampFromDate: (dateArg: string) =>
    firestore.Timestamp.fromDate(new Date(dateArg))
};

export const factory = new Factory(web);
