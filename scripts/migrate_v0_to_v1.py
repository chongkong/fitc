import collections
import datetime
import functools
import itertools
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


def ldap_from_name(name):
    user_mapping = get_v0_user_mapping()
    return user_mapping[name]['ldap']


def preprocess_data(df: pd.DataFrame):
    # Check available columns.
    if set(df.columns) != set([
        'Time', 'Winner', 'Blue Player1', 'Blue Player2', 'Red Player1',
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
    names_from_dataset = set(
        list(df['Blue Player1']) + list(df['Blue Player2']) +
        list(df['Red Player1']) + list(df['Red Player2']))
    unknown_names = [
        name for name in names_from_dataset if name not in user_mapping
    ]
    if unknown_names:
        if 'y' != input('Some of the names are not recognized.\n' +
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

    df.loc[df.Winner == 'BLUE', 'w1'] = df['Blue Player1'].map(ldap_from_name)
    df.loc[df.Winner == 'BLUE', 'w2'] = df['Blue Player2'].map(ldap_from_name)
    df.loc[df.Winner == 'BLUE', 'l1'] = df['Red Player1'].map(ldap_from_name)
    df.loc[df.Winner == 'BLUE', 'l2'] = df['Red Player2'].map(ldap_from_name)

    df.loc[df.Winner == 'RED', 'w1'] = df['Red Player1'].map(ldap_from_name)
    df.loc[df.Winner == 'RED', 'w2'] = df['Red Player2'].map(ldap_from_name)
    df.loc[df.Winner == 'RED', 'l1'] = df['Blue Player1'].map(ldap_from_name)
    df.loc[df.Winner == 'RED', 'l2'] = df['Blue Player2'].map(ldap_from_name)

    df.drop('Winner', axis=1, inplace=True)
    df.drop('Blue Player1', axis=1, inplace=True)
    df.drop('Blue Player2', axis=1, inplace=True)
    df.drop('Red Player1', axis=1, inplace=True)
    df.drop('Red Player2', axis=1, inplace=True)


def make_firestore_client(emulate: bool):
    if emulate:
        os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'
    app = firebase_admin.initialize_app(
        credential=credentials.Certificate("../serviceAccountKey.json"))
    return firestore.client(app)


class StatsRecorder(object):
    def __init__(self):
        self._player_stats = collections.defaultdict(self._empty_player_stats)
        self._season_stats = collections.defaultdict(self._empty_season_stats)
        self._rival_stats = collections.defaultdict(self._empty_rival_stats)
        self._team_stats = collections.defaultdict(self._empty_team_stats)

    def __len__(self):
        return len(self._player_stats) + len(self._season_stats) + len(
            self._rival_stats) + len(self._team_stats)

    @staticmethod
    def _get_season(dt: datetime.datetime):
        return str(dt.year)

    def _add_win(self, stats, win_streaks):
        stats['totalWins'] += 1
        if 'recentGames' in stats:
            stats['recentGames'] = ('W' + stats['recentGames'])[:100]
        if 'mostWinStreaks' in stats:
            stats['mostWinStreaks'] = max(stats['mostWinStreaks'], win_streaks)

    def _add_lose(self, stats):
        stats['totalLoses'] += 1
        if 'recentGames' in stats:
            stats['recentGames'] = ('L' + stats['recentGames'])[:100]

    @staticmethod
    def _empty_player_stats():
        return dict(totalWins=0,
                    totalLoses=0,
                    mostWinStreaks=0,
                    recentGames='')

    @staticmethod
    def _empty_season_stats():
        return dict(totalWins=0, totalLoses=0)

    @staticmethod
    def _empty_rival_stats():
        return dict(totalWins=0, totalLoses=0, recentGames='')

    @staticmethod
    def _empty_team_stats():
        return dict(totalWins=0,
                    totalLoses=0,
                    mostWinStreaks=0,
                    recentGames='')

    def add_record(self, winners, losers, win_streaks, created_at):
        season = self._get_season(created_at)
        for winner in winners:
            self._add_win(self._player_stats[winner], win_streaks)
            self._add_win(self._season_stats[(winner, season)], win_streaks)
        for loser in losers:
            self._add_lose(self._player_stats[loser])
            self._add_lose(self._season_stats[(loser, season)])
        for winner, loser in itertools.product(winners, losers):
            self._add_win(self._rival_stats[(winner, loser)], win_streaks)
            self._add_lose(self._rival_stats[(loser, winner)])
        self._add_win(self._team_stats[tuple(sorted(winners))], win_streaks)
        self._add_lose(self._team_stats[tuple(sorted(losers))])

    def list_stats(self):
        for ldap, player_stats in self._player_stats.items():
            yield 'playerStats/{}'.format(ldap), player_stats
        for args, season_stats in self._season_stats.items():
            yield 'playerStats/{}/seasons/{}'.format(*args), season_stats
        for args, rival_stats in self._rival_stats.items():
            yield 'playerStats/{}/rivals/{}'.format(*args), rival_stats
        for teammates, team_stats in self._team_stats.items():
            yield 'teamStats/{}'.format(','.join(teammates)), team_stats


def first_play_time(df, ldap):
    min_index = len(df)
    for col in ['w1', 'w2', 'l1', 'l2']:
        series = df[df[col] == ldap]
        if not series.empty:
            min_index = min(min_index, series.index[0])
    if min_index < len(df):
        return df.loc[min_index].Time
    else:
        raise ValueError('No game found for player {}'.format(ldap))


def save_data(df: pd.DataFrame, emulate: bool):
    db = make_firestore_client(emulate=emulate)

    # Creates foosball table entry

    db.document('tables/default').set({'name': 'GFC-24F', 'recentPlayers': []})

    # Creates players

    batch = db.batch()

    user_mapping = get_v0_user_mapping()
    all_player_ldaps = set([
        player_doc.to_dict()['ldap']
        for player_doc in db.collection('players').stream()
    ])

    num_registered_players = 0
    for player_data in tqdm(user_mapping.values(),
                            total=len(user_mapping),
                            desc='Players'):
        ldap = player_data['ldap']
        if ldap in all_player_ldaps:
            continue
        player_data.update(createdAt=first_play_time(df, ldap))
        num_registered_players += 1
        batch.set(db.document('players/{}'.format(ldap)), player_data)

    batch.commit()
    print('Finished writing {} Players'.format(num_registered_players))

    batch = db.batch()
    stats_recorder = StatsRecorder()

    prev_winners = set([])
    prev_win_streaks = 0
    prev_timestamp = 0
    for i, row in tqdm(df.iterrows(), total=len(df), desc='GameRecords'):
        timestamp_millis = row.Time.value // 10**6
        # Check for winStreaks.
        if (timestamp_millis - prev_timestamp < 60 * 60 * 1000
                and prev_winners == {row.w1, row.w2}):
            win_streaks = prev_win_streaks + 1
            prev_win_streaks = win_streaks
        else:
            win_streaks = 1
            prev_win_streaks = 1
        prev_winners = {row.w1, row.w2}
        prev_timestamp = timestamp_millis

        batch.set(
            db.document('tables/default/records/{}'.format(timestamp_millis)),
            dict(winners=[row.w1, row.w2],
                 losers=[row.l1, row.l2],
                 isDraw=False,
                 winStreaks=win_streaks,
                 createdAt=row.Time.to_pydatetime(),
                 recordedBy='IMPORTER_V0'))
        stats_recorder.add_record(winners=[row.w1, row.w2],
                                  losers=[row.l1, row.l2],
                                  win_streaks=win_streaks,
                                  created_at=row.Time.to_pydatetime())
        if i % 100 == 0:
            batch.commit()
            batch = db.batch()

    batch.commit()
    print('Finished writing {} GameRecords'.format(len(df)))

    batch = db.batch()
    for i, (path, data) in tqdm(enumerate(stats_recorder.list_stats()),
                                total=len(stats_recorder),
                                desc='Stats'):
        batch.set(db.document(path), data)
        if i % 100 == 0:
            batch.commit()
            batch = db.batch()

    batch.commit()
    print('Finished writing {} Stats'.format(len(stats_recorder)))


def main(csv_filename: str, emulate: bool = True):
    if not emulate:
        if input("You're about to run migration script against prod server."
                 "This script must be invoked after disabling firebase"
                 "functions first. Did you turn off the firebase function"
                 "and aware of the consecutive impact of running this? [y/n]") != 'y':
            return

    df = pd.read_csv(csv_filename)
    preprocess_data(df)
    print('Preprocessing done')
    save_data(df, emulate)


if __name__ == '__main__':
    fire.Fire(main)
