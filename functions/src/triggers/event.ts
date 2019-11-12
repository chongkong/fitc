import * as functions from 'firebase-functions';

import { Player, Event, PromotionEvent } from 'common/types';
import { firestore } from 'functions/src/admin';

export const onGameRecordCreate = functions.firestore
    .document('events/{eventId}')
    .onCreate(snapshot => {
      const event = snapshot.data() as Event;
      if (event.type === 'promotion') {
        let promotion = event.payload as PromotionEvent;
        let updates: Partial<Player> = {
          level: promotion.levelTo,
          isNewbie: false,
          lastLevelUpdate: new Date()
        };
        return firestore.doc(`players/${promotion.ldap}`).update(updates);
      } 
      else if (event.type === 'demotion') {
        let promotion = event.payload as PromotionEvent;
        let updates: Partial<Player> = {
          level: promotion.levelTo,
          lastLevelUpdate: new Date()
        };
        return firestore.doc(`players/${promotion.ldap}`).update(updates);
      }
    });
