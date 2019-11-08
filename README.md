# Fitc

Foosball in the Cloud from KR-SEO engineers.

## Development environment

Stack we're using

* Angular
* Cloud Firestore
* Firebase functions

### Installation

1. [MacOS] Install Node.js using `brew install node`. It will install Node.js as well as Node package manager (NPM).
2. Install project npm packages using `npm install`. Run the command inside the project directory.
3. Install [Angular CLI](https://github.com/angular/angular-cli) using `npm install --global @angular/cli`.
4. Install Firebase CLI using `npm install --global firebase-tools`.

### Angular CLI usage

To run an Angular app in local development server, you can use Angular CLI (`ng` in command line) with following commands:

* Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
* Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.
* Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.
* Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
* Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

### Directory structure

```
common/     -- Common definitions for both FE and BE
e2e/        -- End to end tests for FE
functions/  -- Firebase functions (BE)
public/     -- Public files (e.g. html, favicon, etc.)
src/        -- Angular codes (FE)
```
