import type { Pool, PoolClient, QueryResultRow } from 'pg'
import { createPool, type PoolOptions } from './pool.js'
import type { SqlFragment } from './sql.js'

export class NoRowsError extends Error {
	constructor(query?: string) {
		const base = 'Expected at least one row, but got none'

		super(query ? `${base}: ${query}` : base)

		this.name = 'NoRowsError'
	}
}

export interface Queryable {
	query<T extends QueryResultRow>(fragment: SqlFragment): Promise<T | null>
	get<T extends QueryResultRow>(fragment: SqlFragment): Promise<T>
	many<T extends QueryResultRow>(fragment: SqlFragment): Promise<T[]>
	exec(fragment: SqlFragment): Promise<number>
	val<T>(fragment: SqlFragment): Promise<T>
}

export interface Db extends Queryable {
	tx<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>
	ping(): Promise<boolean>
	pool: Pool
}

function createQueryable(executor: { query: Pool['query'] | PoolClient['query'] }): Queryable {
	return {
		async query<T extends QueryResultRow>(fragment: SqlFragment): Promise<T | null> {
			const { rows } = await executor.query<T>(fragment as never)

			return rows[0] ?? null
		},

		async get<T extends QueryResultRow>(fragment: SqlFragment): Promise<T> {
			const { rows } = await executor.query<T>(fragment as never)

			if (rows.length === 0) {
				throw new NoRowsError(fragment.text)
			}

			return rows[0]
		},

		async many<T extends QueryResultRow>(fragment: SqlFragment): Promise<T[]> {
			const { rows } = await executor.query<T>(fragment as never)

			return rows
		},

		async exec(fragment: SqlFragment): Promise<number> {
			const { rowCount } = await executor.query(fragment as never)

			return rowCount ?? 0
		},

		async val<T>(fragment: SqlFragment): Promise<T> {
			const { rows } = await executor.query<Record<string, T>>(fragment as never)

			if (rows.length === 0) {
				throw new NoRowsError(fragment.text)
			}

			const firstRow = rows[0]
			const keys = Object.keys(firstRow)

			return firstRow[keys[0]]
		},
	}
}

export function createDatabaseClient(pool: Pool): Db {
	const queryable = createQueryable(pool)

	return {
		...queryable,
		pool,

		async ping(): Promise<boolean> {
			try {
				await pool.query('SELECT 1')

				return true
			} catch {
				return false
			}
		},

		async tx<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
			const client = await pool.connect()

			try {
				await client.query('BEGIN')

				const tx = createQueryable(client)

				const result = await fn(tx)

				await client.query('COMMIT')

				return result
			} catch (err) {
				await client.query('ROLLBACK')

				throw err
			} finally {
				client.release()
			}
		},
	}
}

export function createDatabase(getDatabaseUrl: () => string, options?: PoolOptions) {
	let pool: Pool | null = null
	let client: Db | null = null

	const init = (): Db => {
		if (!client) {
			pool = createPool(getDatabaseUrl(), options)
			client = createDatabaseClient(pool)
		}

		return client
	}

	const db = new Proxy({} as Db, {
		get(_, prop) {
			return init()[prop as keyof Db]
		},
	})

	return {
		db,

		getPool() {
			return init().pool
		},

		async closePool() {
			if (pool) {
				await pool.end()

				pool = null
				client = null
			}
		},
	}
}
