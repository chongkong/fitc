import * as functions from 'firebase-functions';

import { Player, Event, PromotionEvent } from '../../../common/types';
import { app } from '../firebase';

export const onEventCreate = functions.firestore
    .document('events/{eventId}')
    .onCreate(snapshot => {
      const event = snapshot.data() as Event;
      if (event.type === 'promotion') {
        const promotion = event.payload as PromotionEvent;
        const updates: Partial<Player> = {
          level: promotion.levelTo,
          isNewbie: false,
          lastLevelUpdate: snapshot.createTime
        };
        return app.firestore()
          .doc(`players/${promotion.ldap}`)
          .update(updates)
          .catch(error => console.error(error));
      } 
      else if (event.type === 'demotion') {
        const promotion = event.payload as PromotionEvent;
        const updates: Partial<Player> = {
          level: promotion.levelTo,
          lastLevelUpdate: snapshot.createTime
        };
        return app.firestore()
          .doc(`players/${promotion.ldap}`)
          .update(updates)
          .catch(error => console.error(error));
      }
      // Explicitly return to suppress Typescript error.
      return;
    });

export const onEventDelete = functions.firestore
    .document('events/{eventId}')
    .onDelete(snapshot => {
      const event = snapshot.data() as Event;

      if (event.type === 'promotion' || event.type === 'demotion') {
        return getPreviousTimestamp(event.payload.ldap).then(prevTime => {
          return app.firestore()
            .doc(`players/${event.payload.ldap}`)
            .update({
              level: event.payload.levelFrom,
              isNewbie: !prevTime,
              lastLevelUpdate: prevTime
            })
        });
      } 
      // Explicitly return to suppress Typescript error.
      return;
    });
async function getPreviousTimestamp(ldap : string) {
  const previousEvent = await app.firestore()
    .collection('events')
    .where('payload.ldap', '==', ldap)
    .orderBy('createdAt', "desc")
    .limit(1)
    .get();
  if(previousEvent.empty){
    return;
  }
  return previousEvent.docs[0].createTime;
}

    
  