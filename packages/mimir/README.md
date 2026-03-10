# mimir

PostgreSQL connection pool.

## Usage

```typescript
import { createPool, closePool } from 'mimir'

const pool = createPool(process.env.DATABASE_URL)

// Query
const result = await pool.query('SELECT * FROM users')

// Cleanup on shutdown
await closePool(pool)
```
