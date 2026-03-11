# norns

**Norns** manages server lifecycle for all services in the monorepo. It exports a single `setupLifecycle` function that handles two concerns:

- **Graceful shutdown** — Listens for `SIGINT` and `SIGTERM`, cleanly closes the HTTP server, runs an optional cleanup callback (e.g., closing database pools), and exits.
- **Port conflict recovery** — Catches `EADDRINUSE` errors on startup, kills the blocking process (`lsof` on macOS, `fuser -k` on Linux), and retries once.

All four services call `setupLifecycle` in their entry points, passing their server instance, name, port, and an optional `onShutdown` callback.

## Usage

```typescript
import { setupLifecycle } from 'norns'

const server = serve({ fetch: app.fetch, port: env.PORT })

// Without cleanup
setupLifecycle({ server, name: 'Bifrost', port: env.PORT })

// With cleanup (e.g. closing a database pool)
setupLifecycle({ server, name: 'Huginn', port: env.PORT, onShutdown: closePool })
```
