export interface Timestamp {
  toMillis: () => number;
  toDate: () => Date;
}

export interface Platform {
  now: () => Timestamp;
  timestampFromDate: (dateArg: string) => Timestamp;
}
