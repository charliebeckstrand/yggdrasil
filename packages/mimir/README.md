# mimir

PostgreSQL connection pool with SSL support for DigitalOcean managed databases. 

Decomposes `DATABASE_URL` into individual connection parameters to work around `SELF_SIGNED_CERT_IN_CHAIN` errors.

## Usage

```typescript
import { createPool, closePool } from 'mimir'

const pool = createPool(process.env.DATABASE_URL)

// Query
const result = await pool.query('SELECT * FROM users')

// Cleanup on shutdown
await closePool(pool)
```
