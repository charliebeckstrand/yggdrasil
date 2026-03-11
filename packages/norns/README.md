# Norns

**Norns** manages server lifecycle for all services in the monorepo. It exports a single `setupLifecycle` function that handles two concerns:

- **Graceful shutdown** — Listens for `SIGINT` and `SIGTERM`, cleanly closes the HTTP server, runs an optional cleanup callback (e.g., closing database pools), and exits.
- **Port conflict recovery** — Catches `EADDRINUSE` errors on startup, kills the blocking process (`lsof` on macOS, `fuser -k` on Linux), and retries once.

## Arguments

`setupLifecycle` accepts a single options object with the following properties:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `server` | `Server` | Yes | Node.js `net.Server` instance to manage |
| `name` | `string` | Yes | Service name used in log messages |
| `port` | `number` | Yes | Port the service listens on |
| `onShutdown` | `() => Promise<void>` | No | Cleanup callback invoked before exit |

## Usage

```typescript
import { setupLifecycle } from 'norns'

const server = serve({ fetch: app.fetch, port: env.PORT })

// Without cleanup
setupLifecycle({ server, name: 'Bifrost', port: env.PORT })

// With cleanup (e.g. closing a database pool)
setupLifecycle({ server, name: 'Huginn', port: env.PORT, onShutdown: closePool })
```
