import * as functions from 'firebase-functions';
import { firestore } from 'firebase';

import { GameRecord } from '../../../common/types';
import { app } from '../firebase';
import { setEquals } from '../../../common/utils';


export const createGameRecord = functions.https.onCall((
  draft: GameRecord, 
  context: functions.https.CallableContext
) => {
  if (draft.winners.length !== 2) {
    throw new functions.https.HttpsError(
      'invalid-argument', 'len(winners) should be 2.');
  } else if (draft.losers.length !== 2) {
    throw new functions.https.HttpsError(
      'invalid-argument', 'len(losers) should be 2.');
  }

  const record: GameRecord = {
    winners: draft.winners,
    losers: draft.losers,
    isTie: draft.isTie,
    winStreaks: 0,
    createdAt: draft.createdAt || firestore.Timestamp.now(),
    recordedBy: draft.recordedBy || '',
  }

  const deferred = [];

  // Track record
  if (context.auth) {
    deferred.push(
      app.auth().getUser(context.auth.uid).then(user => {
        if (user && user.email && user.email.endsWith('@google.com')) {
          record.recordedBy = user.email.split('@')[0];
        } else {
          record.recordedBy = '';
        }
      })
    );
  }

  if (!draft.isTie) {
    deferred.push(
      getPreviousRecord(record.createdAt).then(prev => {
        if (prev && !prev.isTie
            && isConsecutivePlay(prev, record)
            && setEquals(prev.winners, record.winners)) {
          record.winStreaks = prev.winStreaks + 1;
        } else {
          record.winStreaks = 1;
        }
      })
    )
  }

  return Promise.all(deferred).then(() => {
    return app.firestore()
      .doc(`tables/default/records/${record.createdAt.toMillis()}`)
      .set(record);
  });
})

async function getPreviousRecord(before: firestore.Timestamp) {
  const prevRecords = await app.firestore().collection(`tables/default/records`)
      .where('createdAt', '<', before)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
  return prevRecords.empty ? undefined : prevRecords.docs[0].data() as GameRecord;
}

function isConsecutivePlay(r1: GameRecord, r2: GameRecord) {
  return r1.createdAt.toMillis() > r2.createdAt.toMillis() - 60 * 60 * 1000;
}
