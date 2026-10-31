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

Both start commands bind to `127.0.0.1`. Requests must use a loopback Host
(`localhost`, `127.0.0.1`, or `[::1]`); browser requests must come from the exact
same origin. Foreign Host, Origin, and cross-site requests are rejected before
the dashboard or API is served. Do not expose this demo through a tunnel, public
reverse proxy, or an overridden listen address. These checks restrict a local
demo; they do not authenticate a user or isolate other users of the same computer.

The npm development, build, and start commands disable Next.js telemetry before
loading its CLI. Use these commands to preserve that default.

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

Only use fictional identities and notes. Simulation inputs and alert notes are
persisted in one shared local SQLite database until you reset it. No retention
deadline or encryption at rest is implemented. API and page responses are marked
`no-store`. The bounded rate limiter shares one quota per route in this process;
it ignores forwarding headers and is not a distributed abuse-control service.

## Resetting demo history

Stop the app, move the generated `data/labyrinth.sqlite*` files to a backup location, and restart. Project Labyrinth will create a fresh database with the built-in seed scenarios. Runtime databases are intentionally excluded from Git.
