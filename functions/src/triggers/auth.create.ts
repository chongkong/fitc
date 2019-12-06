import * as functions from "firebase-functions";

import { Path } from "../../../common/path";
import { factory } from "../../../common/platform/admin";
import { firestore } from "../firebase";

const ALLOWED_DOMAINS = ["google.com"];

export const onUserCreate = functions.auth.user().onCreate(async user => {
  if (!user.email) {
    return;
  }
  const [ldap, domain] = user.email.split("@");
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return;
  }

  const player = await firestore()
    .doc(Path.player(ldap))
    .get();

  if (!player.exists) {
    return Promise.all([
      firestore()
        .doc(Path.player(ldap))
        .set(
          factory.createPlayer({
            name: user.displayName || ldap,
            ldap
          })
        ),
      firestore()
        .doc(Path.playerStats(ldap))
        .set(factory.emptyPlayerStats())
    ]);
  }
  // Explicitly return to suppress Typescript error.
  return;
});
