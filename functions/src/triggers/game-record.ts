// Trigger on GameRecord document creation/modification.
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import {
  GameRecord,
  Player,
  PlayerStats,
  TeamStats,
  RivalStats,
  SeasonStats
} from "../../../common/types";
import { Path } from "../../../common/path";
import { factory } from "../../../common/platform/admin";
import { Timestamp } from "../../../common/platform/base";
import { firestore } from "../firebase";
import { TableState, PlayerState } from "../internal-types";
import {
  reducePlayerStats,
  reduceTableState,
  reduceRivalStats,
  reduceSeasonStats,
  reducePlayerState,
  reduceTeamStats
} from "../reducers";
import { checkLevelUpdate } from "../level-update-policy";

export const onGameRecordCreate = functions.firestore
  .document("tables/{tableId}/records/{recordId}")
  .onCreate(async (snapshot, context) => {
    // We don't want to produce any side effect on ADMIN mode.
    if (context.authType === "ADMIN") {
      console.error(context.authType, context.auth);
      return;
    }

    const { tableId } = context.params;
    const record = snapshot.data() as GameRecord;
    const batch = firestore().batch();

    // Refresh TableState to retrieve winStreaks.

    const stateSnapshot = await firestore()
      .doc(TableState.path(tableId))
      .get();
    const oldState = stateSnapshot.exists
      ? (stateSnapshot.data() as TableState)
      : TableState.initial();
    const newState = reduceTableState(oldState, record);
    batch.set(firestore().doc(TableState.path(tableId)), newState);

    // Update Player-wise data.

    const baseContext = { batch, ...newState.lastRecord };

    await Promise.all([
      ...record.winners.map(ldap =>
        updatePlayer({
          ...baseContext,
          ldap,
          opponents: record.losers,
          result: record.isDraw ? "D" : "W"
        })
      ),
      ...record.losers.map(ldap =>
        updatePlayer({
          ...baseContext,
          ldap,
          opponents: record.winners,
          result: record.isDraw ? "D" : "L"
        })
      ),
      updateTeamStats({
        ...baseContext,
        ldaps: record.winners,
        result: record.isDraw ? "D" : "W"
      }),
      updateTeamStats({
        ...baseContext,
        ldaps: record.losers,
        result: record.isDraw ? "D" : "L"
      })
    ]);

    // All batch has been written.
    return batch.commit();
  });

async function updatePlayer(context: {
  batch: admin.firestore.WriteBatch;
  ldap: string;
  opponents: string[];
  result: "W" | "L" | "D";
  createdAt: Timestamp;
  winStreaks: number;
}) {
  await Promise.all([updatePlayerState(context), updatePlayerStats(context)]);
}

async function updatePlayerState({
  batch,
  ldap,
  result,
  createdAt
}: {
  batch: admin.firestore.WriteBatch;
  ldap: string;
  result: "W" | "L" | "D";
  createdAt: Timestamp;
}) {
  const [player, state] = await firestore().getAll(
    firestore().doc(Path.player(ldap)),
    firestore().doc(Path.playerState(ldap))
  );
  const oldState = state.exists
    ? (state.data() as PlayerState)
    : PlayerState.initial();
  const newState = reducePlayerState(oldState, { result });
  batch.set(state.ref, newState);

  const { recentGames } = newState;
  const { level } = player.data() as Player;
  const delta = checkLevelUpdate({ recentGames, level });

  if (delta > 0) {
    batch.create(
      firestore().doc(Path.promotionEvent(createdAt, ldap)),
      factory.createPromotionEvent({
        ldap,
        levelFrom: level,
        levelTo: level + delta
      })
    );
  } else if (delta < 0) {
    batch.create(
      firestore().doc(Path.demotionEvent(createdAt, ldap)),
      factory.createDemotionEvent({
        ldap,
        levelFrom: level,
        levelTo: level + delta
      })
    );
  }
}

async function updatePlayerStats({
  batch,
  ldap,
  opponents,
  result,
  createdAt,
  winStreaks
}: {
  batch: admin.firestore.WriteBatch;
  ldap: string;
  opponents: string[];
  result: "W" | "L" | "D";
  createdAt: Timestamp;
  winStreaks: number;
}) {
  const [playerStats, seasonStats, ...rivalStats] = await firestore().getAll(
    firestore().doc(Path.playerStats(ldap)),
    firestore().doc(Path.seasonStats(ldap, createdAt.toDate().getFullYear())),
    ...opponents.map(opponentLdap =>
      firestore().doc(Path.rivalStats(ldap, opponentLdap))
    )
  );

  // Update PlayerStats.
  batch.set(
    playerStats.ref,
    reducePlayerStats(
      playerStats.exists
        ? (playerStats.data() as PlayerStats)
        : factory.emptyPlayerStats(),
      { result, winStreaks }
    )
  );

  // Update SeasonStats.
  batch.set(
    seasonStats.ref,
    reduceSeasonStats(
      seasonStats.exists
        ? (seasonStats.data() as SeasonStats)
        : factory.emptySeasonStats(),
      { result }
    )
  );

  // Update RivalStats.
  rivalStats.forEach(stats => {
    batch.set(
      stats.ref,
      reduceRivalStats(
        stats.exists ? (stats.data() as RivalStats) : factory.emptyRivalStats(),
        { result }
      )
    );
  });
}

async function updateTeamStats({
  batch,
  ldaps,
  result,
  winStreaks
}: {
  batch: admin.firestore.WriteBatch;
  ldaps: string[];
  result: "W" | "L" | "D";
  createdAt: Timestamp;
  winStreaks: number;
}) {
  const teamStats = await firestore()
    .doc(Path.teamStats(...ldaps))
    .get();

  batch.set(
    teamStats.ref,
    reduceTeamStats(
      teamStats.exists
        ? (teamStats.data() as TeamStats)
        : factory.emptyTeamStats(),
      { result, winStreaks }
    )
  );
}
