# Fitc

Foosball in the Cloud from KR-SEO engineers.

This is a frontend & backend repository for next generation foosball app.

# Development environment

Stacks we're using

* **Angular** for a frontend framework.
* **Cloud Firestore** for storing data (for free!)
* **Firebase functions** for serverless data manipulation (for free!)

## Directory structure

```
common/     -- Common definitions for both FE and BE
e2e/        -- End to end tests for FE
functions/  -- Firebase functions (BE)
public/     -- Public files (e.g. html, favicon, etc.)
src/        -- Angular codes (FE)
```

## Installation steps

1. Install Node Version Manager (nvm) and install node
   ```shell
   $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
   $ nvm install stable
   ```
2. Install project npm packages using `npm install`. Run the command inside the
   project root directory and `functions/` subdirectory. (twice!)
3. Install Firebase CLI using `npm install --global firebase-tools`.
4. (FE ONLY) Install [Angular CLI](https://github.com/angular/angular-cli) using 
   `npm install --global @angular/cli`.
5. Setup python environment as instructed from
   [`scripts/README.md`](scripts/README.md)

### Troubleshooting during installation

* If you're using corp laptop, Santa might block your execution. You can
  temporariliy disable Santa by running
  ```shell
  $ launchctl unload /Library/LaunchDaemons/com.google.santad.plist
  ```
* You need to install java, if you haven't already, in order to use firebase
  emulator. In Mac you can install it with `brew cask install java`.

## Code Formatting

This project uses [Prettier](https://prettier.io/) formatter for typescripts,
and [autopep8](https://github.com/hhatto/autopep8) for python. You can easily
find a plugin for them!

## Frontend Development

### Angular CLI usage

To run an Angular app in local development server, you can use Angular CLI (`ng`
in command line) with following commands:

* Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app
  will automatically reload if you change any of the source files. 
* Run `ng generate component component-name` to generate a new component. You
  can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.
* Run `ng build` to build the project. The build artifacts will be stored in the
  `dist/` directory. Use the `--prod` flag for a production build.
* Run `ng test` to execute the unit tests via
  [Karma](https://karma-runner.github.io).
* Run `ng e2e` to execute the end-to-end tests via
  [Protractor](http://www.protractortest.org/).

### Running local firestore emulator

Instead of directly connecting to a live firestore database, we can run a [local
firebase emulator](https://firebase.google.com/docs/rules/emulator-setup).

```shell
$ firebase emulators:start
```

The emulator firestore database instance is completely empty on every run! Since
there's no feature for initial data for the firestore emulator
[yet](https://github.com/firebase/firebase-tools/issues/1167), we have to
manually run a python script `scripts/init_emulator.py`. The script adds initial
data for development.

To view local firestore data, you can use `scripts/firestore_shell.py` 

### Deployment

TBD

## Backend Development

Our backend is a Firebase trigger implemented in NodeJS, inside `functions/` directory.

### Firebase functions

Before running firebase emulator, all functions should be compiled first (which
is not done automatically)

```shell
$ cd functions
$ npm run build
```

TBD

### Tests

We're using [Jest](https://jestjs.io/). Test configuration files are
`jest.integ.config.js` and `jest.unit.test.js`.

* Run Unit tests with `npm run test:unit`.
* Integration test with `npm run test:integ`. Unlike unittests, integration test
  requires local firebase emulator running, and run sequentially. (Firestore
  does not support multiple database) Integration tests look for side effects
  triggered by Firebase functions, but emulator doesn't provide a mechanism to
  wait until all triggers done. Therefore we're currently doing enough `sleep()`
  to wait for triggers done, but the numbers are arbitrary and would not be
  enough in a future.

### Deployment

TBD
