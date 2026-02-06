# Platformer

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.11.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with Jest, use the following command:

```bash
npm run test
```

For test coverage:

```bash
npm run test:all
```

## Running end-to-end tests

This project uses **Playwright** for comprehensive E2E testing. The test suite includes:

- Game canvas rendering tests
- Player controls and input tests
- HUD display and game mechanics tests

To run E2E tests:

```bash
npm run test:e2e
```

For interactive test development (recommended):

```bash
npm run test:e2e:ui
```

Additional test commands:

- `npm run test:e2e:headed` - Run with visible browser
- `npm run test:e2e:debug` - Debug mode
- `npm run playwright:report` - View test report

See [PLAYWRIGHT_SETUP.md](PLAYWRIGHT_SETUP.md) for detailed testing documentation.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
