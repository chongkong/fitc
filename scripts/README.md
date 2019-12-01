# FitC-Scripts

This directory contains one-off scripts for the FitC project.

* `init_emulator.py` creates dummy data that are useful for local development.
  Run the script after running firebase emulator with `firebase emulators:start`
  command.
* `firestore_shell.py` is a interactive mini shell for navigating local
  firestore emulator. This is for read only, and does not support for write yet.
* `migrate_v0_to_v1.py <exported_csv_filename>` is a script to migrate existing
  spreadsheet based game history into a firestore with new schema. You should
  disable all firebase functions before running. Some of the side effects from
  firebase trigger (such as level update) should not be used during migration,
  but there is currently no good way to distinguish such WRITE requests from the
  others. Also it is a lot faster to calculate side effects in a batch from
  local.
  * `user_mapping_v0` contains `Player` schema for the existing user entry from
    spreadsheet.
* `promo_threshold_gen.py` generates promotion threshold for current level
  update strategy. For example, you can generate promotion threshold for 100
  games with winrate=$5/9$ with 95% confidence by:
  ```shell
  $ python promo_threshold_gen.py
  --min_games=10 \
  --winrate=0.555555555 \
  --confidence=0.9499999 \
  --window_size=100
  ```

# Setup Development Environment

## Python Setup

Source code uses typing syntax which requires >=3.7 version. If you're not
familiar with Python, please follow the next step to setup virtual Python
environments. If you know how to use virtualenv and have your own
preference, you can skip to Poetry section.

### pyenv

[`pyenv`](https://github.com/pyenv/pyenv) is the recommended way of managing
multiple python versions as well as virtualenvs. `pyenv` is a python version
manager like `nvm`, which handles installation and switching of multiple python
versions. You can add virtualenv functionality by installing `pyenv-virtualenv`
plugin. See [this
doc](https://lhy.kr/configuring-the-python-development-environment-with-pyenv-and-virtualenv)
for more detail on installation. Here I picked up some commands to install
pyenv.

**In MacOS**

```shell
$ brew install pyenv pyenv-virtualenv
$ pyenv init
$ pyenv virtualenv-init
```

**In Linux**

```shell
$ curl -L https://raw.githubusercontent.com/yyuu/pyenv-installer/master/bin/pyenv-installer | bash
$ pyenv init
$ pyenv virtualenv-init
```

Once you run the `init` command, it prints the direction to configure your shell
config. For example, if you're using a `bash`, Add following lines to your
`~/.bash_profile`.

```shell
$ eval "$(pyenv init -)"
$ eval "$(pyenv virtualenv-init -)"
```

After installing pyenv, you can search for and install python3

```shell
$ pyenv install --list | grep 3.X
$ pyenv install 3.X.Y  # Or other latest version in the future.
$ pyenv virtualenv 3.X.Y fitc-scripts  # Creates virtualenv
$ pyenv activate fitc-scripts
```

You can make `fitc/scripts` directory to automatically enable virtualenv with
`pyenv local` command. This will create `.python_version` file that is
recognized by `pyenv`.

```shell
$ # Inside fitc/scripts directory
$ cd path/to/fitc/scripts
$ pyenv local fitc-scripts
```

### Poetry

Package versions are managed by [poetry](https://poetry.eustace.io/docs). Poetry
is not a python version or virtualenv manager, thus you should create your own
virtualenv first (e.g. with `pyenv`) before using poetry.

```shell
$ # Inside virtualenv
$ poetry install
```

If you're 


## Credentials

Scripts that are manipulating firestore or other firebase products should have
service account authentication. We need a service account keyfile for that.
Please request Jongbin for the `serviceAccountKey.json` file and place it under
project root directory (under `fitc/`.)

