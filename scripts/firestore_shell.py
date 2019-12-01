import cmd
import datetime
import os
import json
import string
import sys
import traceback
import readline

from colorama import Fore, Style
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud.firestore_v1 import client
import pygments
from pygments import lexers
from pygments import formatters

readline.parse_and_bind("tab: complete")  # For Linux
readline.parse_and_bind("bind ^I rl_complete")  # For Mac with libedit


def make_firestore_client(emulate: bool) -> client.Client:
    if emulate:
        os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
    app = firebase_admin.initialize_app(
        credential=credentials.Certificate("../serviceAccountKey.json"))
    return firestore.client(app)


def is_doc(path):
    """Check given path is a document path or not.
    Only even index segment (except 0) is a documemnt path.
    """
    return not is_root(path) and len(path.split("/")) % 2 == 0


def is_collection(path):
    """Whether given path is a collection path or not.
    Only odd index segment is a documemnt path.
    """
    return not is_root(path) and not is_doc(path)


def is_root(path):
    """Whether given path is a root path"""
    return path == ""


def canonical_path(raw_path):
    # Mechanical cleanup
    path = raw_path.strip()
    # Ignore abspath and trailing slash
    if path.startswith('/'):
        path = path[1:]
    if path.endswith('/') and path != '/':
        path = path[:-1]
    if path == '':
        return path
    # Resolve '.' and '..'
    segments = []
    for s in path.split("/"):
        if s == ".":
            continue
        elif s == "..":
            if segments:
                segments.pop()
        elif s == "":
            raise ValueError('Invalid path "{}"'.format(raw_path))
        else:
            segments.append(s)
    path = "/".join(segments)
    return path


ALLOWED_CHARS = set(string.digits + string.ascii_letters +
                    "!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~")


def compose(pwd, relpath):
    """Compose a new path from pwd to given relative path."""
    return canonical_path(join(pwd, relpath))


def join(*segments):
    segments = list(segments)
    path_builder = []
    for s in segments:
        if s.startswith('/'):
            path_builder.clear()
            path_builder.append(s)
        else:
            if path_builder and not path_builder[-1].endswith('/'):
                path_builder.append('/')
            if s != '':
                path_builder.append(s)
    return ''.join(path_builder)


def split(path):
    splits = path.split("/")
    if len(splits) == 2 and path.startswith('/'):
        return '/', splits[-1]
    return "/".join(splits[:-1]), splits[-1]


def dirname(path):
    return split(path)[0]


def basename(path):
    return split(path)[1]


class FirestoreShell(cmd.Cmd):
    intro = "Welcome to Firestore shell v0.0.1. Type help for available commands"

    def __init__(self, emulate=True):
        super().__init__()
        self.db = make_firestore_client(emulate)
        self.pwd = ""
        self._formatter = formatters.get_formatter_by_name('terminal256')

    @property
    def prompt(self):
        return ''.join([
            Style.BRIGHT, Fore.YELLOW, '[', Fore.CYAN, self.pwd, Fore.YELLOW,
            '] 🔥 ', Style.RESET_ALL
        ])

    def doc(self, path):
        assert is_doc(path)
        return self.db.document(path).get().to_dict()

    def subcollections(self, path):
        assert is_root(path) or is_doc(path)
        if path == "":
            return [c.id for c in self.db.collections()]
        else:
            return [c.id for c in self.db.document(path).collections()]

    def docs(self, path):
        assert is_collection(path)
        return [d.id for d in self.db.collection(path).stream()]

    def _doc_exists(self, path):
        return self.db.document(path).get().exists

    def _collection_exists(self, path):
        return basename(path) in self.subcollections(dirname(path))

    def _compose_from_pwd(self, path):
        if any(c not in ALLOWED_CHARS for c in path):
            raise ValueError('Invalid character: "{}"\n'.format(path) +
                             "                    {}".format("".join(
                                 "^" if c not in ALLOWED_CHARS else " "
                                 for c in path)))
        return compose(self.pwd, path)

    def _complete_valid_path(self, segment: str):
        segment_dir, segment_base = split(segment)
        try:
            parent_path = self._compose_from_pwd(segment_dir)
        except ValueError:
            return []
        valid_bases = []
        if is_root(parent_path):
            valid_bases = self.subcollections("")
        elif is_doc(parent_path):
            if self._doc_exists(parent_path):
                valid_bases = self.subcollections(parent_path)
        elif is_collection(parent_path):
            if self._collection_exists(parent_path):
                valid_bases = self.docs(parent_path)
        candidates = [
            base for base in valid_bases
            if base.lower().startswith(segment_base.lower())
        ]
        return [join(segment_dir, base) for base in candidates]

    @staticmethod
    def _json_serialize(python_obj):
        if hasattr(python_obj, 'rfc3339'):
            return python_obj.rfc3339()
        if isinstance(python_obj, datetime.datetime):
            return python_obj.strftime('<datetime %Y-%m-%dT%H:%M:%S>')
        if hasattr(python_obj, '__dict__'):
            return python_obj.__dict__
        return repr(python_obj)

    def _print_json(self, dict_or_text):
        if isinstance(dict_or_text, dict):
            dict_or_text = json.dumps(
                dict_or_text, indent=2, default=self._json_serialize)
        print(
            pygments.highlight(dict_or_text, lexers.get_lexer_by_name('json'),
                               self._formatter))

    def _print_traceback(self):
        etype, value, tb = sys.exc_info()
        tb_text = "\n".join(traceback.format_exception(etype, value, tb))
        print(
            pygments.highlight(tb_text, lexers.get_lexer_by_name('py3tb'),
                               self._formatter))

    def do_cd(self, path):
        """Change working directory"""
        try:
            path = self._compose_from_pwd(path)
        except ValueError as e:
            print("***", e)
            return

        if is_doc(path):
            if self._doc_exists(path):
                self.pwd = path
            else:
                print('*** Document "{}" does not exist'.format(path))
        elif is_collection(path):
            if self._collection_exists(path):
                self.pwd = path
            else:
                print('*** Collection "{}" does not exist'.format(path))
        else:
            self.pwd = ""

    def complete_cd(self, text, line, begidx, endidx):
        return self._complete_valid_path(text)

    def do_ls(self, path):
        """List directory"""
        try:
            path = self._compose_from_pwd(path)
        except ValueError as e:
            print(e)
            return

        if is_root(path):
            print("\n".join(self.subcollections("")))
        elif is_doc(path):
            if self._doc_exists(path):
                print("\n".join(self.subcollections(path)))
        elif is_collection(path):
            if self._collection_exists(path):
                print("\n".join(self.docs(path)))

    def complete_ls(self, text, line, begidx, endidx):
        return self._complete_valid_path(text)

    def do_show(self, path):
        """Show current doc contents"""
        try:
            path = self._compose_from_pwd(path)
        except ValueError as e:
            print(e)
            return

        if is_doc(path):
            if self._doc_exists(path):
                self._print_json(self.doc(path))
            else:
                print('Document "{}" does not exist'.format(path))
        else:
            print('"{}" is not a document'.format(path))

    def complete_show(self, text, line, begidx, endidx):
        return self._complete_valid_path(text)

    def do_quit(self, *args):
        print("Bye 👋🏻")
        return True

    def do_exit(self, *args):
        print("Bye 👋🏻")
        return True

    def post_cmd(self, stop, line):
        if stop:
            return

        # Check if self.pwd is still valid
        if is_doc(self.pwd):
            if not self._doc_exists(self.pwd):
                print('*** Document "{}" no longer exists'.format(self.pwd))
                self.pwd = ""
        elif is_collection(self.pwd):
            if not self._collection_exists(self.pwd):
                print("*** Collection {} no longer exists".format(self.pwd))
                self.pwd = ""

    def emptyline(self):
        # Do nothing instead of reexecuting command (default behavior)
        return

    def onecmd(self, line):
        # Don't quit on Error.
        try:
            return super().onecmd(line)
        except Exception:
            self._print_traceback()
            return

    def cmdloop(self, *args, **kwargs):
        while True:
            try:
                super().cmdloop(*args, **kwargs)
                break
            except KeyboardInterrupt:
                print("\nBye 👋🏻")
                break


if __name__ == "__main__":
    FirestoreShell().cmdloop()
