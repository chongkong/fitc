import * as functions from "firebase-functions";

import {
  Player,
  Event,
  DemotionEvent,
  PromotionEvent
} from "../../../common/types";
import { Path } from "../../../common/path";
import { firestore } from "../firebase";

export const onEventCreate = functions.firestore
  .document("events/{eventId}")
  .onCreate(snapshot => {
    const event = snapshot.data() as Event;
    if (event.type === "promotion") {
      const promotion = (event as unknown) as PromotionEvent;
      return firestore()
        .doc(Path.player(promotion.ldap))
        .update({
          level: promotion.levelTo
        } as Partial<Player>)
        .catch(error => console.error(error));
    } else if (event.type === "demotion") {
      const demotion = (event as unknown) as DemotionEvent;
      return firestore()
        .doc(Path.player(demotion.ldap))
        .update({
          level: demotion.levelTo
        } as Partial<Player>)
        .catch(error => console.error(error));
    }
    // Explicitly return to suppress Typescript error.
    return;
  });
