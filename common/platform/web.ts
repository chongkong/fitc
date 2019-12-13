import { firestore } from "firebase/app";
import { Platform } from "./base";
import { Factory } from "../factory";

export const web: Platform = {
  now: () => firestore.Timestamp.now(),
  timestampFromDate: (dateArg: string) =>
    firestore.Timestamp.fromDate(new Date(dateArg)),
  timestampFromMillis: (millis: number) =>
    firestore.Timestamp.fromMillis(millis)
};

export const factory = new Factory(web);
