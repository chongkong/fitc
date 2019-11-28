import { Timestamp } from '@google-cloud/firestore';
import { firestore } from '../firebase';
import { GameRecord } from '../../../common/types';
import { toSymbol } from '../reducers';

export async function listPlayerRecentGames(
  ldap: string,
  rangeFrom?: Timestamp,
  limit?: number
) {
  const records = firestore().collectionGroup('records');
  let queries = [
    records.where('winners', 'array-contains', ldap),
    records.where('losers', 'array-contains', ldap),
  ];
  if (rangeFrom) {
    queries = queries.map(q => q.where('createdAt', '>', rangeFrom));
  }
  queries = queries.map(q => q.orderBy('createdAt', 'desc'));
  if (limit) {
    queries = queries.map(q => q.limit(limit));
  }

  const results = await Promise.all(queries.map(q => q.get()));
  return results
    .flatMap(snapshot => snapshot.docs.map(doc => doc.data() as GameRecord))
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, limit);
}

export async function listPlayerRecentGamesAsSymbol(
  ldap: string,
  rangeFrom?: Timestamp,
  limit?: number
) {
  const records = await listPlayerRecentGames(ldap, rangeFrom, limit);
  return records.map(record => toSymbol(record, ldap));
}
