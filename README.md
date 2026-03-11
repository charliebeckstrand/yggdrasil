# Yggdrasil

TypeScript Microservices (Hono + Turborepo)

## Services

| Service | Role | Port |
| --- | --- | --- |
| **[Bifrost](services/bifrost)** | API Gateway | `3000` |
| **[Forseti](services/forseti)** | Intent Orchestrator | `3001` |
| **[Huginn](services/huginn)** | Event Bus | `3002` |
| **[Vidar](services/vidar)** | Monitoring | `3003` |

## Packages

| Package | Description |
| --- | --- |
| **[Heimdall](packages/heimdall)** | JWT auth guard |
| **[Mimir](packages/mimir)** | PostgreSQL connection pool |
| **[Saga](packages/saga)** | PostgreSQL logging and search |
| **[Norns](packages/norns)** | Hono server lifecycle handling |
| **[Grid](packages/grid)** | Hono middleware, proxy, SSE streaming, auth, and schemas |
| **[Frigg](packages/frigg)** | Environment secrets provisioning |

## Architecture

Forseti is the intent-based service orchestrator. Services register with Forseti on startup by
providing their OpenAPI spec URL. Forseti discovers all available operations automatically and
routes intent resolution requests to the right service endpoints.

- Services declare intents: `forseti.resolve('vidar.check-ip', { ip })` or `forseti.declare('vidar.ingest-event', { ... })`
- No service knows about any other service — they only know Forseti
- Forseti logs every resolution with timing and outcome

Bifrost acts as the API gateway:

- `/auth/*`, `/api/*` -> handled directly by Bifrost
- Ban checks and security events route through Forseti to Vidar
- `/events/*` -> Huginn (event bus), `/vidar/*` -> Vidar (proxied)

All services share a common middleware stack via `createApp()`:

- CORS, secure headers, request logging
- Server-Timing headers (via `hono/timing`)
- Compression and ETag caching
- Trailing slash normalization

### Authentication

- **Browser clients**: Cookie-based sessions with CSRF protection (Bifrost)
- **Service-to-service**: Bearer token auth (`Authorization: Bearer <key>`)
- **WebSocket**: API key via query parameter (Forseti)

### Real-time

- **WebSocket**: Full-duplex messaging via Forseti
- **SSE**: Event streaming via Huginn (`GET /events/stream`) and Vidar (`GET /vidar/stream`)

## Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 16+ (or Docker 20.10+)

## Development

Each service has its own scripts:

```bash
pnpm dev          # Watch mode
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Lint with Biome
```

## CI/CD

GitHub Actions runs on push to `main` and on pull requests.

A successful CI run triggers deployment to DigitalOcean App Platform.
