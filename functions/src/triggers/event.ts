import * as functions from 'firebase-functions';
import { Timestamp } from '@google-cloud/firestore';

import { Player, Event, PromotionEvent } from '../../../common/types';
import { firestore } from '../firebase';

export const onEventCreate = functions.firestore
    .document('events/{eventId}')
    .onCreate(snapshot => {
      const event = snapshot.data() as Event;
      if (event.type === 'promotion') {
        const promotion = event.payload as PromotionEvent;
        const updates: Partial<Player> = {
          level: promotion.levelTo,
          lastLevelUpdate: Timestamp.now()
        };
        return firestore()
          .doc(`players/${promotion.ldap}`)
          .update(updates)
          .catch(error => console.error(error));
      } 
      else if (event.type === 'demotion') {
        const promotion = event.payload as PromotionEvent;
        const updates: Partial<Player> = {
          level: promotion.levelTo,
          lastLevelUpdate: Timestamp.now()
        };
        return firestore()
          .doc(`players/${promotion.ldap}`)
          .update(updates)
          .catch(error => console.error(error));
      }
      // Explicitly return to suppress Typescript error.
      return;
    });
