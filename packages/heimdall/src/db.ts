import { createDatabaseClient, type Db } from 'mimir'
import { getConfig } from './config.js'

let _db: Db | null = null

export function createDatabase(): Db {
	if (!_db) _db = createDatabaseClient(getConfig().getPool())

	return _db
}
