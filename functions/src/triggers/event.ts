import * as functions from 'firebase-functions';

import { Player, Event, PromotionEvent } from '../../../common/types';
import { firestore } from '../admin';

export const onEventCreate = functions.firestore
    .document('events/{eventId}')
    .onCreate(snapshot => {
      const event = snapshot.data() as Event;
      if (event.type === 'promotion') {
        const promotion = event.payload as PromotionEvent;
        const updates: Partial<Player> = {
          level: promotion.levelTo,
          isNewbie: false,
          lastLevelUpdate: new Date()
        };
        return firestore.doc(`players/${promotion.ldap}`).update(updates);
      } 
      else if (event.type === 'demotion') {
        const promotion = event.payload as PromotionEvent;
        const updates: Partial<Player> = {
          level: promotion.levelTo,
          lastLevelUpdate: new Date()
        };
        return firestore.doc(`players/${promotion.ldap}`).update(updates);
      }
      // Explicitly return to suppress Typescript error.
      return;
    });