import * as functions from "firebase-functions";
import * as httpm from "typed-rest-client/HttpClient";

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
  .onCreate(async snapshot => {
    const event = snapshot.data() as Event;
    const deferred = [];
    if (event.type === "promotion") {
      const promotion = (event as unknown) as PromotionEvent;
      if (process.env.FUNCTIONS_EMULATOR !== "true") {
        deferred.push(sendRequestToChatbot(createPromotionMessage(promotion)));
      }
      deferred.push(
        firestore()
          .doc(Path.player(promotion.ldap))
          .update({
            level: promotion.levelTo
          } as Partial<Player>)
          .catch(error => console.error(error))
      );
    } else if (event.type === "demotion") {
      const demotion = (event as unknown) as DemotionEvent;
      if (process.env.FUNCTIONS_EMULATOR !== "true") {
        deferred.push(sendRequestToChatbot(createDemotionMessage(demotion)));
      }
      deferred.push(
        firestore()
          .doc(Path.player(demotion.ldap))
          .update({
            level: demotion.levelTo
          } as Partial<Player>)
          .catch(error => console.error(error))
      );
    }
    // Explicitly return to suppress Typescript error.
    return Promise.all(deferred);
  });

async function sendRequestToChatbot(notificationMessage: string) {
  const httpc: httpm.HttpClient = new httpm.HttpClient("chatbot-api");
  try {
    const res = await httpc.post(
      "https://chat.googleapis.com/v1/spaces/AAAABla7Mcw/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=cBQgmz8Raswg2wLfhP3dDMDiddxkuL1Xf3QdbsQqXl8%3D",
      JSON.stringify({
        text: notificationMessage
      })
    );
    const body = JSON.parse(await res.readBody());
    if (body.error) {
      console.error(body.error);
    }
  } catch (err) {
    console.error("Failed: " + err.message);
  }
}

function createPromotionMessage({ ldap, levelFrom, levelTo }: PromotionEvent) {
  return `🚀 ${ldap} is promoted from ${levelFrom} to ${levelTo}. Congratulations!`;
}

function createDemotionMessage({ ldap, levelFrom, levelTo }: DemotionEvent) {
  return `😿 ${ldap} is demoted from ${levelFrom} to ${levelTo}.`;
}
