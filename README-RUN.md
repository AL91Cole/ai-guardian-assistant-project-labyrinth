# Run Project Labyrinth

## Requirements

- Node.js 20.9 or newer
- npm

## Development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

The app writes its generated SQLite files to `data/`. To use another location, copy `.env.example` to `.env.local` and change `LABYRINTH_DATA_DIR`:

```dotenv
LABYRINTH_DATA_DIR=/absolute/path/to/labyrinth-data
```

Do not point this variable at a directory containing unrelated data.

## Quality checks

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

`npm run check` runs lint, tests, and the production build in sequence.

## Production-mode demonstration

```bash
npm run build
npm start
```

This starts the same local educational simulation with production-optimized Next.js output. It does not make the project suitable for a public or production security boundary. Add real authentication, externalized state, distributed rate limiting, secrets management, observability, and deployment-specific hardening before considering any shared environment.

## Resetting demo history

Stop the app, move the generated `data/labyrinth.sqlite*` files to a backup location, and restart. Project Labyrinth will create a fresh database with the built-in seed scenarios. Runtime databases are intentionally excluded from Git.
