import functools
import json
import os
import sys
from typing import Any, Dict

from dateutil import parser
import fire
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import pandas as pd
from tqdm import tqdm


@functools.lru_cache(maxsize=1)
def get_v0_user_mapping() -> Dict[str, Any]:
  with open('./user_mapping_v0.json', 'r') as f:
    return json.load(f)


def ldap_of(name):
  user_mapping = get_v0_user_mapping()
  return user_mapping[name]['ldap']


def preprocess_data(df: pd.DataFrame):
  # Check available columns.
  if set(df.columns) != set([
    'Time',
    'Winner',
    'Blue Player1',
    'Blue Player2',
    'Red Player1',
    'Red Player2'
  ]):
    print('Invalid csv columns: ', df.columns)
    exit(1)

  # Check time and map it

  time_col = df['Time']
  time_col = time_col.map(lambda x: x.replace('한국 표준시', 'KST'))
  time_col = time_col.map(lambda x: x.replace('Korean Standard Time', 'KST'))
  time_col = time_col.map(parser.parse)
  df['Time'] = time_col

  # Check Winner column

  assert set(df.Winner) == {'BLUE', 'RED'}

  # Check players columns

  user_mapping = get_v0_user_mapping()
  unknown_names = [
    name_appeared
    for name_appeared in set(
      list(df['Blue Player1']) + 
      list(df['Blue Player2']) +
      list(df['Red Player1']) + 
      list(df['Red Player2'])
    )
    if name_appeared not in user_mapping
  ]
  if unknown_names:
    if 'y' != input(
      'Some of the names are not recognized.\n' + 
      ', '.join(unknown_names) + '\n' +
      'Do you want to continue? [y/n]'):
      exit(1)

    # Drop rows containing unknown name
    for name in unknown_names:
      df.drop(df[df['Blue Player1'] == name].index, inplace=True)
      df.drop(df[df['Blue Player2'] == name].index, inplace=True)
      df.drop(df[df['Red Player1'] == name].index, inplace=True)
      df.drop(df[df['Red Player2'] == name].index, inplace=True)

  # Make winners and losers columns

  df.loc[df.Winner == 'BLUE', 'w1'] = df['Blue Player1'].map(ldap_of)
  df.loc[df.Winner == 'BLUE', 'w2'] = df['Blue Player2'].map(ldap_of)
  df.loc[df.Winner == 'BLUE', 'l1'] = df['Red Player1'].map(ldap_of)
  df.loc[df.Winner == 'BLUE', 'l2'] = df['Red Player2'].map(ldap_of)

  df.loc[df.Winner == 'RED', 'w1'] = df['Red Player1'].map(ldap_of)
  df.loc[df.Winner == 'RED', 'w2'] = df['Red Player2'].map(ldap_of)
  df.loc[df.Winner == 'RED', 'l1'] = df['Blue Player1'].map(ldap_of)
  df.loc[df.Winner == 'RED', 'l2'] = df['Blue Player2'].map(ldap_of)

  df.drop('Winner', axis=1, inplace=True)
  df.drop('Blue Player1', axis=1, inplace=True)
  df.drop('Blue Player2', axis=1, inplace=True)
  df.drop('Red Player1', axis=1, inplace=True)
  df.drop('Red Player2', axis=1, inplace=True)


def make_firestore_client(emulate: bool):
  if emulate:
    os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'
  firebase_admin.initialize_app(
    credential=credentials.Certificate('../serviceAccountKey.json'))
  return firestore.client()


def save_data(df: pd.DataFrame, emulate: bool):
  db = make_firestore_client(emulate=emulate)

  # Creates foosball table entry

  db.document('tables/default').create({
    'name': 'GFC-24F',
    'recentPlayers': []
  })

  # Creates players

  batch = db.batch()

  user_mapping = get_v0_user_mapping()
  all_player_ldaps = set([
    player_doc.to_dict()['ldap']
    for player_doc in db.collection('players').stream()
  ])

  num_registered_players = 0
  for player_data in tqdm(user_mapping.values(), total=len(user_mapping), desc='Players'):
    ldap = player_data['ldap']
    if ldap in all_player_ldaps:
      continue
    num_registered_players += 1
    batch.set(db.document('players/{}'.format(ldap)), dict(
      **player_data,
      is_newbie=(player_data['level'] == 1)
    ))
    batch.set(db.document('stats/{}'.format(ldap)), dict(
      totalWins=0,
      totalLoses=0,
      mostWinStreaks=0,
      recentGames='',
      perSeason={},
      asOpponent={},
      asTeammate={}
    ))

  print('About to write {} Players'.format(num_registered_players))
  batch.commit()
  print('Player registered')

  batch = db.batch()
  for i, row in tqdm(df.iterrows(), total=len(df), desc='GameRecords'):
    timestamp_millis = row.Time.value // 10**6
    batch.set(db.document('tables/default/records/{}'.format(timestamp_millis)), dict(
      winners=[row.w1, row.w2],
      losers=[row.l1, row.l2],
      isTie=False,
      winStreaks=0,
      createdAt=row.Time.to_pydatetime(),
      recordedBy='admin',
      __preventEvent=True,  # Do not trigger promo/demo event on this.
    ))
    if i % 100 == 0:
      batch.commit()
      batch = db.batch()

  # Commit final batch
  batch.commit()


def main(csv_filename: str, emulate: bool = True):
  df = pd.read_csv(csv_filename)
  preprocess_data(df)
  print('Preprocessing done')
  save_data(df, emulate)


if __name__ == '__main__':
  fire.Fire(main)
