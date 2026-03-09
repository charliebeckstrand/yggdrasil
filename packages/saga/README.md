# saga

PostgreSQL logging and search for Hono services. 

Store and query structured log entries via a mountable, OpenAPI-documented router.

## Usage

```ts
import { createLogsApp, createLog, queryLogs } from 'saga'
```

### Mount the full app (with OpenAPI docs)

```ts
import { createLogsApp } from 'saga'

const logsApp = createLogsApp(pool)

app.route('/', logsApp)
```

### Mount just the router

```ts
import { createLogsRouter } from 'saga'

app.route('/logs', createLogsRouter(pool))
```

### Use service functions directly

```ts
import { createLog, createBatch, queryLogs } from 'saga'

await createLog(pool, { level: 'info', service: 'bifrost', message: 'Request received', type: 'server', metadata: {} })

await queryLogs(pool, { limit: 50, offset: 0, service: 'bifrost' })
```
