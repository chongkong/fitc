import { Timestamp } from '@google-cloud/firestore';
import { GameRecord } from '../../../common/types';
import { firestore } from '../firebase';

export async function listPlayerRecentGames({
  ldap, rangeAfter, limit, resultOnly
}: {
  ldap: string,
  rangeAfter?: Timestamp,
  limit?: number,
  resultOnly?: boolean
}) {
  const records = firestore().collectionGroup('records');
  let queries = [
    records.where('winners', 'array-contains', ldap),
    records.where('losers', 'array-contains', ldap),
  ];
  if (rangeAfter) {
    queries = queries.map(q => q.where('createdAt', '>', rangeAfter));
  }
  queries = queries.map(q => q.orderBy('createdAt', 'desc'));
  if (limit) {
    queries = queries.map(q => q.limit(limit));
  }
  if (resultOnly) {
    queries = queries.map(q => q.select('createdAt', 'isDraw'));
  }

  const results = await Promise.all(queries.map(q => q.get()));

  if (resultOnly) {
    return results
      .flatMap((snapshot, index) => snapshot.docs.map(doc => {
        const data = doc.data() as Partial<GameRecord>;
        const result = data.isDraw ? 'D' 
          : (index === 0) ? 'W' 
          : 'L';
        return Object.assign(data, { result });
      }))
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .map(data => data.result)
      .slice(0, limit);
  } else { 
    return results
      .flatMap(snapshot => snapshot.docs.map(doc => doc.data() as GameRecord))
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, limit);
  }
}

