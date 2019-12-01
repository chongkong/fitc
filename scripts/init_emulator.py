import json
import os

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore


def get_firestore_emulator():
    # Firestore client uses emulator if environment variable is set.
    # https://github.com/googleapis/google-cloud-python/blob/master/firestore/google/cloud/firestore_v1/client.py#L121
    os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'
    app = firebase_admin.initialize_app(
        credential=credentials.Certificate("../serviceAccountKey.json"))
    return firestore.client(app)


def init_firestore():
    db = get_firestore_emulator()
    print(db)
    batch = db.batch()

    def add_player(ldap, name, level):
        print('Add player {}'.format(ldap))
        batch.set(db.collection('players').document(ldap), {
            'name': name,
            'ldap': ldap,
            'level': level
        })
        print('Add playerStats {}'.format(ldap))
        batch.set(db.collection('playerStats').document(ldap), {
            'totalWins': 0,
            'totalLoses': 0,
            'mostWinStreaks': 0,
            'recentGames': '',
        })

    def add_table(table_id, name, recent_players):
        print('Add table {}'.format(table_id))
        batch.set(db.collection('tables').document(table_id), {
            'name': name,
            'recentPlayers': recent_players
        })

    add_player(ldap='jjong', name='Jongbin Park', level=2)
    add_player(ldap='hyeonjilee', name='Hyeonji Lee', level=3)
    add_player(ldap='shinjiwon', name='Jiwon Shin', level=2)
    add_player(ldap='anzor', name='Anzor Balkar', level=4)
    add_player(ldap='hdmoon', name='Hyundo Moon', level=2)

    add_table(
        table_id='default',
        name='Default',
        recent_players=['jjong', 'hyeonjilee', 'shinjiwon', 'anzor', 'hdmoon']
    )

    batch.commit()


if __name__ == '__main__':
    init_firestore()
